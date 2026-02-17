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
 * These 4 define HOW to write and WHO we're writing for.
 */
export const CORE_CONTENT_VARIABLES: string[] = [
  'tone_descriptors',
  'vocabulary_preferred',
  'vocabulary_avoided',
  'brand_archetype',
];

/**
 * ROTATING variables — a random subset is selected per post for variety.
 * Each post gets 3-4 of these, creating diverse content that doesn't repeat the same angles.
 */
export const ROTATING_CONTENT_VARIABLES: string[] = [
  // Audience
  'icp_pains',
  'icp_desires',
  'icp_emotional_triggers',
  'icp_objections',
  // Enemy
  'enemy_name',
  'enemy_description',
  'enemy_cost',
  // Messaging
  'message_core',
  'message_pillars',
  'positioning_statement',
  'content_themes',
  'beliefs_to_teach',
  // Offer
  'offer_name',
  'offer_outcome',
  'offer_problem',
];

/** Total variables per post = CORE (4) + ROTATING pick (3) = 7 */
const ROTATING_PICK_COUNT = 3;

/**
 * Smart variable selector: picks 7 variables per post.
 * - 4 core (always present for voice consistency)
 * - 3 randomly selected from the rotating pool (for content variety)
 *
 * This keeps prompt size ~70% smaller than sending all 40+ variables,
 * and creates natural variety across posts in a batch.
 */
export function selectSmartVariables(itemIndex?: number): string[] {
  // Shuffle the rotating pool
  const pool = [...ROTATING_CONTENT_VARIABLES];

  // Use itemIndex as a seed offset to ensure different posts in a batch get different variables
  // (but still randomized so batches don't repeat the same pattern)
  const seed = (itemIndex || 0) + Date.now();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.abs((seed * (i + 1) * 2654435761) % (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const picked = pool.slice(0, ROTATING_PICK_COUNT);
  return [...CORE_CONTENT_VARIABLES, ...picked];
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
