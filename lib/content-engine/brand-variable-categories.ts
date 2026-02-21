export interface BrandVariableCategory {
  key: string;
  label: string;
  outputKeys: string[];
}

export const BRAND_VARIABLE_CATEGORIES: BrandVariableCategory[] = [
  {
    key: 'icp',
    label: 'Ideal Client Profile (ICP)',
    outputKeys: [
      'icp_demographics',
      'icp_pains',
      'icp_desires',
      'icp_emotional_triggers',
      'icp_internal_dialogue',
      'icp_objections',
      'icp_psychographics',
      'icp_buying_triggers',
      'customer_journey_stages',
    ],
  },
  {
    key: 'brand',
    label: 'Brand Identity',
    outputKeys: [
      'brand_archetype',
      'brand_characteristics',
      'brand_purpose',
      'brand_values',
      'brand_origin_story',
      'founder_story',
      'category',
    ],
  },
  {
    key: 'enemy',
    label: 'Enemy & Market',
    outputKeys: [
      'enemy_name',
      'enemy_description',
      'enemy_cost',
      'enemy_false_promises',
    ],
  },
  {
    key: 'offer',
    label: 'Offer & Lead Magnet',
    outputKeys: [
      'offer_name',
      'offer_tagline',
      'offer_problem',
      'offer_outcome',
      'offer_transformation_before',
      'offer_transformation_after',
      'offer_inclusions',
      'offer_price_display',
      'offer_billing_frequency',
      'offer_tier',
      'offer_objections',
      'lead_magnet_type',
      'lead_magnet_title',
      'lead_magnet_promise',
      'lead_magnet_content_outline',
    ],
  },
  {
    key: 'voice',
    label: 'Brand Voice',
    outputKeys: [
      'tone_descriptors',
      'vocabulary_preferred',
      'vocabulary_avoided',
    ],
  },
  {
    key: 'messaging',
    label: 'Messaging & Positioning',
    outputKeys: [
      'message_core',
      'message_pillars',
      'positioning_statement',
      'differentiation_statement',
      'competitive_landscape',
      'beliefs_to_teach',
    ],
  },
  {
    key: 'content',
    label: 'Content Strategy',
    outputKeys: [
      'content_themes',
      'content_pillars',
    ],
  },
  {
    key: 'growth',
    label: 'Growth Engine',
    outputKeys: [
      'authority_pitch',
      'authority_publish_plan',
      'authority_product_ecosystem',
      'authority_profile_plan',
      'authority_partnerships',
      'conversion_business_type',
      'conversion_strategy',
      'conversion_funnel',
      'conversion_metrics',
    ],
  },
];

export const AI_GENERATION_VARIABLES: string[] = BRAND_VARIABLE_CATEGORIES.flatMap(c => c.outputKeys);

/**
 * CORE variables — always included in every post (non-negotiable for brand alignment).
 * These 7 define WHO we are, HOW to write, and WHAT we stand for.
 */
export const CORE_CONTENT_VARIABLES: string[] = [
  'tone_descriptors',
  'vocabulary_preferred',
  'vocabulary_avoided',
  'brand_archetype',
  'brand_characteristics',
  'brand_values',
  'message_core',
];

/**
 * ROTATING variables — legacy pool kept for backward compat.
 * @deprecated Use selectStrategicVariables() instead.
 */
export const ROTATING_CONTENT_VARIABLES: string[] = [
  'icp_pains',
  'icp_desires',
  'icp_emotional_triggers',
  'icp_objections',
  'enemy_name',
  'enemy_description',
  'enemy_cost',
  'message_pillars',
  'positioning_statement',
  'content_themes',
  'beliefs_to_teach',
  'offer_name',
  'offer_outcome',
  'offer_problem',
];

// ── Strategic Variable Map ─────────────────────────────────────
// Maps funnel_stage × storybrand_stage → 5 curated variables per post.
// Total per post: 7 CORE + 5 strategic = 12 variables.

type StrategicCombo = `${string}_${string}`;

const STRATEGIC_VARIABLE_MAP: Record<StrategicCombo, string[]> = {
  // ── AWARENESS ──
  awareness_character:            ['icp_pains', 'icp_desires', 'icp_emotional_triggers', 'enemy_name', 'brand_origin_story'],
  awareness_external_problem:     ['icp_pains', 'enemy_name', 'enemy_description', 'enemy_cost', 'positioning_statement'],
  awareness_internal_problem:     ['icp_emotional_triggers', 'icp_internal_dialogue', 'enemy_description', 'beliefs_to_teach', 'brand_origin_story'],
  awareness_philosophical_problem:['enemy_false_promises', 'enemy_cost', 'beliefs_to_teach', 'brand_purpose', 'positioning_statement'],
  awareness_guide:                ['brand_origin_story', 'founder_story', 'icp_pains', 'icp_desires', 'content_themes'],
  awareness_plan:                 ['icp_pains', 'icp_desires', 'content_themes', 'message_pillars', 'offer_outcome'],
  awareness_call_to_action:       ['icp_desires', 'offer_name', 'offer_outcome', 'lead_magnet_title', 'content_themes'],
  awareness_failure:              ['icp_pains', 'enemy_cost', 'enemy_false_promises', 'icp_objections', 'beliefs_to_teach'],
  awareness_success:              ['icp_desires', 'offer_outcome', 'offer_transformation_after', 'brand_origin_story', 'content_themes'],

  // ── CONSIDERATION ──
  consideration_character:            ['icp_psychographics', 'icp_desires', 'founder_story', 'brand_origin_story', 'content_themes'],
  consideration_external_problem:     ['icp_pains', 'icp_objections', 'enemy_description', 'positioning_statement', 'differentiation_statement'],
  consideration_internal_problem:     ['icp_internal_dialogue', 'icp_emotional_triggers', 'icp_objections', 'beliefs_to_teach', 'offer_problem'],
  consideration_philosophical_problem:['enemy_false_promises', 'beliefs_to_teach', 'competitive_landscape', 'positioning_statement', 'brand_purpose'],
  consideration_guide:                ['founder_story', 'brand_origin_story', 'competitive_landscape', 'differentiation_statement', 'message_pillars'],
  consideration_plan:                 ['offer_name', 'offer_inclusions', 'offer_outcome', 'conversion_strategy', 'message_pillars'],
  consideration_call_to_action:       ['offer_name', 'offer_outcome', 'lead_magnet_title', 'lead_magnet_promise', 'conversion_strategy'],
  consideration_failure:              ['icp_objections', 'enemy_cost', 'offer_transformation_before', 'competitive_landscape', 'beliefs_to_teach'],
  consideration_success:              ['offer_outcome', 'offer_transformation_after', 'icp_desires', 'founder_story', 'message_pillars'],

  // ── CONVERSION ──
  conversion_character:            ['icp_desires', 'icp_buying_triggers', 'offer_name', 'offer_outcome', 'founder_story'],
  conversion_external_problem:     ['offer_problem', 'offer_outcome', 'icp_objections', 'enemy_cost', 'conversion_strategy'],
  conversion_internal_problem:     ['icp_internal_dialogue', 'icp_objections', 'offer_transformation_before', 'offer_transformation_after', 'offer_name'],
  conversion_philosophical_problem:['brand_purpose', 'beliefs_to_teach', 'offer_name', 'offer_outcome', 'positioning_statement'],
  conversion_guide:                ['founder_story', 'offer_name', 'offer_inclusions', 'differentiation_statement', 'conversion_strategy'],
  conversion_plan:                 ['offer_name', 'offer_inclusions', 'offer_outcome', 'conversion_funnel', 'conversion_strategy'],
  conversion_call_to_action:       ['offer_name', 'offer_outcome', 'offer_inclusions', 'lead_magnet_title', 'conversion_strategy'],
  conversion_failure:              ['enemy_cost', 'icp_objections', 'offer_transformation_before', 'offer_name', 'conversion_strategy'],
  conversion_success:              ['offer_outcome', 'offer_transformation_after', 'icp_desires', 'offer_name', 'authority_pitch'],
};

/** Number of strategic variables per post */
const STRATEGIC_PICK_COUNT = 5;

/**
 * Strategic variable selector: picks 12 variables per post.
 * - 7 CORE (always present for voice/personality consistency)
 * - 5 strategically mapped based on funnel × storybrand stage
 *
 * Falls back to random selection from the full pool if no strategic
 * mapping exists for the given combination.
 */
export function selectStrategicVariables(
  funnelStage?: string,
  storybrandStage?: string,
  _contentAngle?: string,
  itemIndex?: number
): string[] {
  // Try strategic mapping first
  if (funnelStage && storybrandStage) {
    const combo: StrategicCombo = `${funnelStage}_${storybrandStage}`;
    const mapped = STRATEGIC_VARIABLE_MAP[combo];
    if (mapped) {
      // Deduplicate: strategic vars might overlap with CORE
      const merged = [...CORE_CONTENT_VARIABLES];
      for (const v of mapped) {
        if (!merged.includes(v)) merged.push(v);
      }
      return merged;
    }
  }

  // Fallback: random selection from the rotating pool (legacy behavior)
  const pool = [...ROTATING_CONTENT_VARIABLES];
  const seed = (itemIndex || 0) + Date.now();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.abs((seed * (i + 1) * 2654435761) % (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, STRATEGIC_PICK_COUNT);
  return [...CORE_CONTENT_VARIABLES, ...picked];
}

/**
 * @deprecated Use selectStrategicVariables() instead. Kept for backward compatibility.
 */
export function selectSmartVariables(itemIndex?: number): string[] {
  return selectStrategicVariables(undefined, undefined, undefined, itemIndex);
}

/**
 * Full essential set (all 14 key variables) — used when user doesn't specify variables
 * but we want a broader context (e.g. legacy flows).
 */
export const ESSENTIAL_CONTENT_VARIABLES: string[] = [
  ...CORE_CONTENT_VARIABLES,
  'icp_pains',
  'icp_desires',
  'enemy_name',
  'enemy_description',
  'message_core',
  'message_pillars',
  'positioning_statement',
  'content_themes',
  'offer_name',
  'offer_outcome',
];

export const VARIABLE_DISPLAY_NAMES: Record<string, string> = {
  icp_demographics: 'ICP Demographics',
  icp_pains: 'ICP Pain Points',
  icp_desires: 'ICP Desires',
  icp_emotional_triggers: 'Emotional Triggers',
  icp_internal_dialogue: 'Internal Dialogue',
  icp_objections: 'Common Objections',
  icp_psychographics: 'Psychographics',
  icp_buying_triggers: 'Buying Triggers',
  customer_journey_stages: 'Customer Journey',
  brand_archetype: 'Brand Archetype',
  brand_characteristics: 'Brand Characteristics',
  brand_purpose: 'Brand Purpose',
  brand_values: 'Brand Values',
  brand_origin_story: 'Origin Story',
  founder_story: 'Founder Story',
  category: 'Category',
  enemy_name: 'Enemy Name',
  enemy_description: 'Enemy Description',
  enemy_cost: 'Cost of the Enemy',
  enemy_false_promises: 'False Promises',
  offer_name: 'Offer Name',
  offer_tagline: 'Offer Tagline',
  offer_problem: 'Problem Solved',
  offer_outcome: 'Outcome Delivered',
  offer_transformation_before: 'Before State',
  offer_transformation_after: 'After State',
  offer_inclusions: 'What\'s Included',
  offer_price_display: 'Price Display',
  offer_billing_frequency: 'Billing Frequency',
  offer_tier: 'Offer Tier',
  offer_objections: 'Objection Handling',
  lead_magnet_type: 'Lead Magnet Type',
  lead_magnet_title: 'Lead Magnet Title',
  lead_magnet_promise: 'Lead Magnet Promise',
  lead_magnet_content_outline: 'Lead Magnet Outline',
  tone_descriptors: 'Tone Descriptors',
  vocabulary_preferred: 'Preferred Vocabulary',
  vocabulary_avoided: 'Avoided Vocabulary',
  message_core: 'Core Message',
  message_pillars: 'Message Pillars',
  positioning_statement: 'Positioning Statement',
  differentiation_statement: 'Differentiation Statement',
  competitive_landscape: 'Competitive Landscape',
  beliefs_to_teach: 'Beliefs to Teach',
  content_themes: 'Content Themes',
  content_pillars: 'Content Pillars',
  authority_pitch: 'Authority Pitch',
  authority_publish_plan: 'Publishing Plan',
  authority_product_ecosystem: 'Product Ecosystem',
  authority_profile_plan: 'Profile & PR Plan',
  authority_partnerships: 'Strategic Partnerships',
  conversion_business_type: 'Business Type',
  conversion_strategy: 'Conversion Strategy',
  conversion_funnel: 'Conversion Funnel',
  conversion_metrics: 'Key Metrics',
};
