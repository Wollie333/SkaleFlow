import { createServiceClient } from '@/lib/supabase/server';
import { getModelConfig, getDefaultModelForFeature, MODEL_CATALOG } from './providers/registry';
import type { AIFeature, AIModelConfig } from './providers/types';

export { calculateCreditCost, checkCredits, deductCredits, addTopupCredits, isSuperAdmin } from './credits';
export { requireCredits } from './middleware';
export { getModelConfig, getModelsForFeature, getProviderAdapter, getDefaultModelForFeature, MODEL_CATALOG } from './providers/registry';
export type { AIFeature, AIProvider, AIModelConfig, AICompletionRequest, AICompletionResponse, AIProviderAdapter } from './providers/types';

/**
 * Get the list of AI models available to a specific user.
 * Resolution: tier rules as baseline, user rules override tier rules.
 * If no rules exist for a model, it's available by default (backward-compatible).
 */
export async function getAvailableModels(
  userId: string,
  feature?: AIFeature
): Promise<AIModelConfig[]> {
  const supabase = createServiceClient();

  // 1. Look up user's subscription tier slug
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  let tierSlug: string | null = null;

  if (membership?.organization_id) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier_id, subscription_tiers(slug)')
      .eq('organization_id', membership.organization_id)
      .limit(1)
      .single();

    if (sub?.subscription_tiers && typeof sub.subscription_tiers === 'object' && 'slug' in sub.subscription_tiers) {
      tierSlug = (sub.subscription_tiers as { slug: string }).slug;
    }
  }

  // 2. Query global platform-wide rules (admin toggle)
  const { data: globalRulesData } = await supabase
    .from('model_access_rules')
    .select('model_id, is_enabled')
    .eq('scope_type', 'global')
    .eq('scope_id', 'platform');
  const globalRules = globalRulesData || [];

  // 3. Query tier-level rules
  let tierRules: { model_id: string; is_enabled: boolean }[] = [];
  if (tierSlug) {
    const { data } = await supabase
      .from('model_access_rules')
      .select('model_id, is_enabled')
      .eq('scope_type', 'tier')
      .eq('scope_id', tierSlug);
    tierRules = data || [];
  }

  // 4. Query user-level rules
  const { data: userRulesData } = await supabase
    .from('model_access_rules')
    .select('model_id, is_enabled')
    .eq('scope_type', 'user')
    .eq('scope_id', userId);
  const userRules = userRulesData || [];

  // 5. Start with full catalog filtered by feature
  let models = feature
    ? MODEL_CATALOG.filter(m => m.features.includes(feature))
    : [...MODEL_CATALOG];

  // 6. Build rule maps (global > tier > user priority for disabling)
  const globalRuleMap = new Map<string, boolean>();
  for (const rule of globalRules) {
    globalRuleMap.set(rule.model_id, rule.is_enabled);
  }

  const tierRuleMap = new Map<string, boolean>();
  for (const rule of tierRules) {
    tierRuleMap.set(rule.model_id, rule.is_enabled);
  }

  const userRuleMap = new Map<string, boolean>();
  for (const rule of userRules) {
    userRuleMap.set(rule.model_id, rule.is_enabled);
  }

  // 7. Filter models: global disabled = hard block, then user > tier
  models = models.filter(model => {
    // Global disable is absolute — admin turned it off for everyone
    if (globalRuleMap.has(model.id) && !globalRuleMap.get(model.id)) {
      return false;
    }
    // User-level override takes priority
    if (userRuleMap.has(model.id)) {
      return userRuleMap.get(model.id)!;
    }
    // Then tier-level rule
    if (tierRuleMap.has(model.id)) {
      return tierRuleMap.get(model.id)!;
    }
    // No rule = available by default
    return true;
  });

  return models;
}

/**
 * Resolve which AI model to use for a given feature + org.
 * Priority: explicit override > org preference > default
 * If the resolved model is not available to the user, falls back to the first available model.
 */
export async function resolveModel(
  orgId: string,
  feature: AIFeature,
  overrideModelId?: string | null,
  userId?: string | null
): Promise<AIModelConfig> {
  // Get available models for user (if userId provided)
  let availableModels: AIModelConfig[] | null = null;
  if (userId) {
    availableModels = await getAvailableModels(userId, feature);
  }

  const isAvailable = (modelId: string) => {
    if (!availableModels) return true; // No user context = no filtering
    return availableModels.some(m => m.id === modelId);
  };

  // 1. Explicit override
  if (overrideModelId) {
    const config = getModelConfig(overrideModelId);
    if (config && config.features.includes(feature) && isAvailable(overrideModelId)) {
      return config;
    }
  }

  // 2. Org preference from database
  const supabase = createServiceClient();
  const { data: pref } = await supabase
    .from('ai_model_preferences')
    .select('model')
    .eq('organization_id', orgId)
    .eq('feature', feature)
    .single();

  if (pref?.model) {
    const config = getModelConfig(pref.model);
    if (config && config.features.includes(feature) && isAvailable(pref.model)) {
      return config;
    }
  }

  // 3. Default — but check availability
  if (availableModels && availableModels.length > 0) {
    return availableModels[0];
  }

  return getDefaultModelForFeature(feature);
}
