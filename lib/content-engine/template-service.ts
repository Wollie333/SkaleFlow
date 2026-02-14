import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, FunnelStage, StoryBrandStage, TemplateCategory, TemplateTier } from '@/types/database';
import {
  getScriptFramework,
  type ContentFormat,
  type ScriptFrameworkResult,
  type HookTemplate,
  type CTATemplate,
  getFormatCategory,
  HOOK_TEMPLATES,
  CTA_TEMPLATES,
  getOutputFormat,
  OUTPUT_FORMATS,
} from '@/config/script-frameworks';

type TemplateRow = Database['public']['Tables']['content_templates']['Row'];
type MappingRow = Database['public']['Tables']['template_stage_mappings']['Row'];

const LOG_PREFIX = '[TEMPLATE-SERVICE]';

// ── Public API ──────────────────────────────────────────────

/**
 * Drop-in replacement for getScriptFramework().
 * Queries DB for the best template, falls back to config on error.
 */
export async function getScriptFrameworkFromDB(
  supabase: SupabaseClient<Database>,
  format: ContentFormat,
  funnelStage: FunnelStage,
  storybrandStage: StoryBrandStage,
  platforms?: string[],
  templateOverrides?: { script?: string; hook?: string; cta?: string }
): Promise<ScriptFrameworkResult> {
  try {
    const formatCategory = getFormatCategory(format);

    // For video scripts, find the best match via stage mappings
    const { data: mappings, error: mappingError } = await supabase
      .from('template_stage_mappings')
      .select(`
        template_id,
        is_primary,
        confidence_score,
        content_templates!inner (
          id,
          template_key,
          name,
          category,
          content_type,
          format_category,
          structure,
          psychology,
          prompt_instructions,
          when_to_use,
          hook_rules,
          body_rules,
          cta_rules,
          tone_voice,
          formatting_rules,
          is_standardised,
          description
        )
      `)
      .eq('funnel_stage', funnelStage)
      .eq('storybrand_stage', storybrandStage)
      .order('is_primary', { ascending: false })
      .order('confidence_score', { ascending: false });

    if (mappingError) {
      console.error(`${LOG_PREFIX} Mapping query error:`, mappingError.message);
      return getScriptFramework(format, funnelStage, storybrandStage, platforms);
    }

    // Filter to templates matching the format category
    const matched = (mappings || []).filter((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tmpl = (m as any).content_templates as TemplateRow;
      return tmpl.is_active !== false && (
        tmpl.format_category === formatCategory ||
        tmpl.category === 'social_framework'
      );
    });

    if (matched.length === 0) {
      console.log(`${LOG_PREFIX} No DB match for ${formatCategory}/${funnelStage}/${storybrandStage}, falling back`);
      return getScriptFramework(format, funnelStage, storybrandStage, platforms);
    }

    // Prefer templates with matching format_category over social_framework
    const formatMatched = matched.filter((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tmpl = (m as any).content_templates as TemplateRow;
      return tmpl.format_category === formatCategory;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const best = (formatMatched.length > 0 ? formatMatched[0] : matched[0]) as any;
    let template = best.content_templates as TemplateRow;

    // If script template is overridden, try to find that specific template in DB
    if (templateOverrides?.script) {
      const overrideKey = templateOverrides.script;
      const { data: overrideTemplate } = await supabase
        .from('content_templates')
        .select('*')
        .eq('template_key', overrideKey)
        .eq('is_active', true)
        .maybeSingle();

      if (overrideTemplate) {
        console.log(`${LOG_PREFIX} Script override found in DB: ${overrideKey} (${overrideTemplate.name})`);
        template = overrideTemplate;
      } else {
        console.log(`${LOG_PREFIX} Script override "${overrideKey}" not found in DB, using auto-selected`);
      }
    }

    // Resolve hook + CTA from DB or fallback (with overrides)
    const hookResult = templateOverrides?.hook
      ? await resolveHookFromDB(supabase, funnelStage, templateOverrides.hook)
      : await resolveHookFromDB(supabase, funnelStage);
    const ctaResult = templateOverrides?.cta
      ? await resolveCTAFromDB(supabase, funnelStage, templateOverrides.cta)
      : await resolveCTAFromDB(supabase, funnelStage);

    // Build output format (keep using the config function — it's format-specific)
    const outputFormat = platforms && platforms.length > 0
      ? getOutputFormat(formatCategory, platforms)
      : OUTPUT_FORMATS[formatCategory as keyof typeof OUTPUT_FORMATS];

    // Build combined prompt instructions — prefer standardised sections if available
    let promptInstructions: string;

    if (template.is_standardised && template.hook_rules && template.body_rules && template.cta_rules) {
      // ── Standardised prompt assembly ──
      promptInstructions = assembleStandardisedPrompt(template);
    } else {
      // ── Legacy prompt assembly (backward-compatible) ──
      promptInstructions = template.prompt_instructions;

      // For social frameworks, inject extra context (structure, psychology, when-to-use)
      if (template.category === 'social_framework') {
        const extras: string[] = [];
        if (template.structure) extras.push(`Structure: ${template.structure}`);
        if (template.psychology) extras.push(`Psychology: ${template.psychology}`);
        if (template.when_to_use && template.when_to_use.length > 0) {
          extras.push(`Best used when: ${template.when_to_use.join('; ')}`);
        }
        if (extras.length > 0) {
          promptInstructions = `${extras.join('\n')}\n\n${promptInstructions}`;
        }
      }
    }

    // Append hook + CTA instructions (for both standardised and legacy)
    promptInstructions = `${promptInstructions}\n\nHook style: ${hookResult.promptInstructions}\n\nCTA style: ${ctaResult.promptInstructions}`;

    console.log(`${LOG_PREFIX} Using DB template: ${template.template_key} (${template.name})`);

    return {
      formatCategory,
      scriptTemplate: template.template_key,
      scriptTemplateName: template.name,
      hookTemplate: hookResult.key as HookTemplate,
      hookTemplateName: hookResult.name,
      ctaTemplate: ctaResult.key as CTATemplate,
      ctaTemplateName: ctaResult.name,
      outputFormat,
      promptInstructions,
    };
  } catch (err) {
    console.error(`${LOG_PREFIX} Unexpected error, falling back to config:`, err);
    return getScriptFramework(format, funnelStage, storybrandStage, platforms);
  }
}

/**
 * Get all templates for admin list, with optional filters.
 */
export async function getAllTemplates(
  supabase: SupabaseClient<Database>,
  filters?: {
    category?: string;
    tier?: string;
    isActive?: boolean;
    search?: string;
  }
) {
  let query = supabase
    .from('content_templates')
    .select('*, template_stage_mappings(*)')
    .order('sort_order', { ascending: true });

  if (filters?.category) {
    query = query.eq('category', filters.category as TemplateCategory);
  }
  if (filters?.tier) {
    query = query.eq('tier', filters.tier as TemplateTier);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,template_key.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`${LOG_PREFIX} getAllTemplates error:`, error.message);
    return [];
  }
  return data || [];
}

/**
 * Get a single template by key.
 */
export async function getTemplateByKey(
  supabase: SupabaseClient<Database>,
  key: string
): Promise<TemplateRow | null> {
  const { data, error } = await supabase
    .from('content_templates')
    .select('*')
    .eq('template_key', key)
    .maybeSingle();

  if (error) {
    console.error(`${LOG_PREFIX} getTemplateByKey error:`, error.message);
    return null;
  }
  return data;
}

/**
 * Get template display name by key (for badge display).
 * Uses a simple in-memory cache within the request.
 */
const templateNameCache = new Map<string, string>();

export async function getTemplateDisplayName(
  supabase: SupabaseClient<Database>,
  key: string
): Promise<string> {
  if (templateNameCache.has(key)) {
    return templateNameCache.get(key)!;
  }

  const template = await getTemplateByKey(supabase, key);
  const name = template?.name || key.replace(/_/g, ' ');
  templateNameCache.set(key, name);
  return name;
}

/**
 * Get ranked templates for a given generation context.
 * Returns templates sorted by relevance.
 */
export async function getTemplatesForGeneration(
  supabase: SupabaseClient<Database>,
  category: string,
  funnelStage: string,
  storybrandStage: string,
  formatCategory?: string
) {
  const { data: mappings } = await supabase
    .from('template_stage_mappings')
    .select(`
      template_id,
      is_primary,
      confidence_score,
      content_templates!inner (
        id,
        template_key,
        name,
        category,
        format_category,
        tier,
        is_active
      )
    `)
    .eq('funnel_stage', funnelStage)
    .eq('storybrand_stage', storybrandStage)
    .order('confidence_score', { ascending: false });

  if (!mappings) return [];

  return mappings
    .filter((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tmpl = (m as any).content_templates as TemplateRow;
      if (!tmpl.is_active) return false;
      if (category && tmpl.category !== category) return false;
      if (formatCategory && tmpl.format_category && tmpl.format_category !== formatCategory) return false;
      return true;
    })
    .map((m) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(m as any).content_templates,
      isPrimary: m.is_primary,
      confidenceScore: m.confidence_score,
    }));
}

// ── Standardised prompt assembly ────────────────────────────

/**
 * Assemble a consistent, high-quality prompt from atomic template sections.
 * This ensures every template gives the AI the same depth and structure of guidance.
 */
function assembleStandardisedPrompt(template: TemplateRow): string {
  const sections: string[] = [];

  // 1. Framework identity
  sections.push(`You are generating content using the "${template.name}" framework.`);

  // 2. Description / overview
  if (template.description) {
    sections.push(`OVERVIEW: ${template.description}`);
  }

  // 3. Structure (the step-by-step flow)
  if (template.structure) {
    sections.push(`STRUCTURE:\n${template.structure}`);
  }

  // 4. Psychology (why it works)
  if (template.psychology) {
    sections.push(`WHY THIS WORKS:\n${template.psychology}`);
  }

  // 5. Hook rules
  if (template.hook_rules) {
    sections.push(`HOOK RULES (Opening):\n${template.hook_rules}`);
  }

  // 6. Body rules
  if (template.body_rules) {
    sections.push(`BODY RULES (Main Content):\n${template.body_rules}`);
  }

  // 7. CTA rules
  if (template.cta_rules) {
    sections.push(`CTA RULES (Closing):\n${template.cta_rules}`);
  }

  // 8. Tone & voice
  if (template.tone_voice) {
    sections.push(`TONE & VOICE:\n${template.tone_voice}`);
  }

  // 9. Formatting rules
  if (template.formatting_rules) {
    sections.push(`FORMATTING:\n${template.formatting_rules}`);
  }

  // 10. When to use context
  if (template.when_to_use && template.when_to_use.length > 0) {
    sections.push(`BEST USED WHEN: ${template.when_to_use.join('; ')}`);
  }

  // 11. Any additional prompt instructions (custom overrides)
  if (template.prompt_instructions) {
    sections.push(`ADDITIONAL INSTRUCTIONS:\n${template.prompt_instructions}`);
  }

  return sections.join('\n\n');
}

// ── Internal helpers ────────────────────────────────────────

async function resolveHookFromDB(
  supabase: SupabaseClient<Database>,
  funnelStage: FunnelStage,
  overrideKey?: string
): Promise<{ key: string; name: string; promptInstructions: string }> {
  // Map funnel stage to hook key
  const hookKeyMap: Record<string, string> = {
    awareness: 'hook_direct_pain',
    consideration: 'hook_curiosity_gap',
    conversion: 'hook_outcome_first',
  };

  // Use override key if provided, otherwise use funnel-based mapping
  const hookKey = overrideKey ? `hook_${overrideKey}` : hookKeyMap[funnelStage];
  if (hookKey) {
    const { data } = await supabase
      .from('content_templates')
      .select('template_key, name, prompt_instructions')
      .eq('template_key', hookKey)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      return {
        key: data.template_key.replace('hook_', ''),
        name: data.name,
        promptInstructions: data.prompt_instructions,
      };
    }
  }

  // Fallback to config
  const configKeyMap: Record<string, string> = {
    awareness: 'direct_pain',
    consideration: 'curiosity_gap',
    conversion: 'outcome_first',
  };
  const configKey = overrideKey || configKeyMap[funnelStage] || 'direct_pain';
  const hook = HOOK_TEMPLATES[configKey as keyof typeof HOOK_TEMPLATES];
  return {
    key: configKey,
    name: hook?.name || configKey,
    promptInstructions: hook?.promptInstructions || '',
  };
}

async function resolveCTAFromDB(
  supabase: SupabaseClient<Database>,
  funnelStage: FunnelStage,
  overrideKey?: string
): Promise<{ key: string; name: string; promptInstructions: string }> {
  const ctaKeyMap: Record<string, string> = {
    awareness: 'cta_soft_engagement',
    consideration: 'cta_consideration',
    conversion: 'cta_direct_action',
  };

  // Use override key if provided, otherwise use funnel-based mapping
  const ctaKey = overrideKey ? `cta_${overrideKey}` : ctaKeyMap[funnelStage];
  if (ctaKey) {
    const { data } = await supabase
      .from('content_templates')
      .select('template_key, name, prompt_instructions')
      .eq('template_key', ctaKey)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      return {
        key: data.template_key.replace('cta_', ''),
        name: data.name,
        promptInstructions: data.prompt_instructions,
      };
    }
  }

  // Fallback to config
  const configKeyMap: Record<string, string> = {
    awareness: 'soft_engagement',
    consideration: 'consideration',
    conversion: 'direct_action',
  };
  const configKey = overrideKey || configKeyMap[funnelStage] || 'soft_engagement';
  const cta = CTA_TEMPLATES[configKey as keyof typeof CTA_TEMPLATES];
  return {
    key: configKey,
    name: cta?.name || configKey,
    promptInstructions: cta?.promptInstructions || '',
  };
}
