// Reads Brand Engine outputs for use in Presence Engine
// Brand outputs are read-only context — never modified by Presence Engine

import { createServiceClient } from '@/lib/supabase/server';

export interface BrandOutputMap {
  [key: string]: unknown;
}

// Key Brand Engine variables that feed into Presence Engine
const PRESENCE_RELEVANT_BRAND_VARS = [
  // Core positioning
  'brand_name',
  'brand_tagline',
  'brand_one_liner',
  'brand_category',
  'category_name',
  'brand_positioning_statement',
  'brand_promise',
  'brand_archetype',
  'brand_personality',
  'brand_characteristics',
  'tone_descriptors',
  'brand_voice',
  // ICP
  'icp_name',
  'icp_demographic',
  'icp_psychographic',
  'icp_pain_points',
  'icp_desires',
  'icp_objections',
  'icp_business_type',
  // Offers
  'offer_type',
  'offer_name',
  'offer_primary',
  'offer_transformation',
  'offer_price_point',
  // StoryBrand
  'storybrand_character',
  'storybrand_problem_external',
  'storybrand_problem_internal',
  'storybrand_guide',
  'storybrand_plan',
  'storybrand_cta',
  'storybrand_success',
  // Visual
  'brand_colors',
  'brand_typography',
  'brand_logo_primary',
];

/**
 * Fetches all locked Brand Engine outputs for a given org.
 * Returns a flat key-value map.
 */
export async function readBrandOutputsForPresence(orgId: string): Promise<BrandOutputMap> {
  const supabase = createServiceClient();

  const { data: outputs, error } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value, is_locked')
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error reading brand outputs:', error);
    return {};
  }

  const map: BrandOutputMap = {};
  for (const output of outputs || []) {
    map[output.output_key] = output.output_value;
  }

  return map;
}

/**
 * Formats brand outputs as context for a specific platform phase.
 * Filters to only relevant variables and formats for AI prompt injection.
 */
export function formatBrandContextForPresence(
  outputs: BrandOutputMap,
  platformKey?: string
): string {
  const sections: string[] = [];

  // Core positioning
  sections.push('## Brand Positioning');
  const positioningVars = [
    'brand_name', 'brand_tagline', 'brand_one_liner', 'brand_category',
    'category_name', 'brand_positioning_statement', 'brand_promise',
  ];
  for (const key of positioningVars) {
    if (outputs[key]) {
      sections.push(`- **${formatVarName(key)}**: ${formatValue(outputs[key])}`);
    }
  }

  // Brand identity
  sections.push('\n## Brand Identity');
  const identityVars = [
    'brand_archetype', 'brand_personality', 'brand_characteristics',
    'tone_descriptors', 'brand_voice',
  ];
  for (const key of identityVars) {
    if (outputs[key]) {
      sections.push(`- **${formatVarName(key)}**: ${formatValue(outputs[key])}`);
    }
  }

  // ICP
  sections.push('\n## Ideal Client Profile');
  const icpVars = [
    'icp_name', 'icp_demographic', 'icp_psychographic',
    'icp_pain_points', 'icp_desires', 'icp_objections', 'icp_business_type',
  ];
  for (const key of icpVars) {
    if (outputs[key]) {
      sections.push(`- **${formatVarName(key)}**: ${formatValue(outputs[key])}`);
    }
  }

  // Offers
  sections.push('\n## Offer');
  const offerVars = [
    'offer_type', 'offer_name', 'offer_primary',
    'offer_transformation', 'offer_price_point',
  ];
  for (const key of offerVars) {
    if (outputs[key]) {
      sections.push(`- **${formatVarName(key)}**: ${formatValue(outputs[key])}`);
    }
  }

  // StoryBrand
  sections.push('\n## StoryBrand Framework');
  const storyVars = [
    'storybrand_character', 'storybrand_problem_external',
    'storybrand_problem_internal', 'storybrand_guide',
    'storybrand_plan', 'storybrand_cta', 'storybrand_success',
  ];
  for (const key of storyVars) {
    if (outputs[key]) {
      sections.push(`- **${formatVarName(key)}**: ${formatValue(outputs[key])}`);
    }
  }

  // Platform-specific context additions
  if (platformKey) {
    sections.push(`\n## Platform Context: ${platformKey}`);
    sections.push(`You are generating content specifically for ${platformKey}. Adapt tone and format to match platform norms.`);
  }

  return sections.join('\n');
}

function formatVarName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

/**
 * Checks if Brand Engine is complete for an org.
 */
export async function isBrandEngineComplete(orgId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('brand_engine_status')
    .eq('id', orgId)
    .single();

  return org?.brand_engine_status === 'completed';
}
