import type { Json } from '@/types/database';

export interface BrandOutput {
  id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
  phase_id: string;
}

export interface ColorPalette {
  name: string;
  primary: string;
  dark_base: string;
  accent: string;
  light: string;
  neutral: string;
}

export interface Typography {
  heading_font: string;
  heading_weight: string;
  body_font: string;
  body_weight: string;
  accent_font?: string;
  accent_weight?: string;
}

export interface DesignSystemColor {
  hex: string;
  rgb: string;
  role: string;
}

export interface DesignSystemColors {
  primary: DesignSystemColor;
  dark_base: DesignSystemColor;
  accent: DesignSystemColor;
  light: DesignSystemColor;
  neutral: DesignSystemColor;
}

export interface TypographyScale {
  display?: { font: string; size: string; weight: string; line_height: string };
  heading?: { font: string; size: string; weight: string; line_height: string };
  subheading?: { font: string; size: string; weight: string; line_height: string };
  body?: { font: string; size: string; weight: string; line_height: string };
  small?: { font: string; size: string; weight: string; line_height: string };
  caption?: { font: string; size: string; weight: string; line_height: string };
}

export interface ParsedBrandData {
  // Phase 1
  brand_purpose?: string;
  brand_vision?: string;
  brand_mission?: string;
  brand_values?: string;
  brand_characteristics?: string;
  brand_archetype?: string;
  brand_non_negotiables?: string;
  brand_origin_story?: string;
  founder_story?: string;
  // Phase 2
  icp_demographics?: string;
  icp_psychographics?: string;
  icp_pains?: string;
  icp_desires?: string;
  icp_emotional_triggers?: string;
  icp_internal_dialogue?: string;
  icp_objections?: string;
  icp_buying_triggers?: string;
  customer_journey_stages?: string;
  // Phase 2A
  enemy_name?: string;
  enemy_type?: string;
  enemy_description?: string;
  enemy_cost?: string;
  enemy_false_promises?: string;
  // Phase 3
  offer_problem?: string;
  offer_outcome?: string;
  offer_inclusions?: string;
  offer_exclusions?: string;
  lead_magnet_type?: string;
  lead_magnet_title?: string;
  lead_magnet_promise?: string;
  lead_magnet_content_outline?: string;
  // Phase 4
  offer_name?: string;
  offer_tagline?: string;
  offer_transformation_before?: string;
  offer_transformation_after?: string;
  // Phase 5
  positioning_statement?: string;
  differentiation_statement?: string;
  category?: string;
  competitive_landscape?: string;
  // Phase 6A
  vocabulary_preferred?: string;
  vocabulary_avoided?: string;
  tone_descriptors?: string;
  industry_terms_embrace?: string;
  industry_terms_reject?: string;
  // Phase 6B
  message_core?: string;
  message_pillars?: string;
  // Phase 7
  brand_logo_primary?: string;
  brand_logo_dark?: string;
  brand_logo_light?: string;
  brand_logo_icon?: string;
  brand_mood_board?: string | string[];
  brand_patterns?: string | string[];
  brand_logo_url?: string; // legacy alias
  brand_color_palette?: ColorPalette;
  brand_typography?: Typography;
  visual_mood?: string;
  imagery_direction?: string;
  brand_elements?: string;
  visual_inspirations?: string;
  brand_visual_guidelines?: string;
  brand_visual_assets_summary?: string;
  // Phase 8
  website_role?: string;
  primary_conversion?: string;
  secondary_conversion?: string;
  traffic_sources?: string;
  website_sitemap?: string;
  user_journey?: string;
  // Phase 8A
  content_themes?: string;
  content_pillars?: string;
  beliefs_to_teach?: string;
  // Phase 8B
  homepage_hero?: string;
  homepage_problem?: string;
  homepage_solution?: string;
  homepage_who_we_help?: string;
  homepage_proof?: string;
  homepage_why_us?: string;
  homepage_final_cta?: string;
  // Phase 8C
  sales_page_hero?: string;
  sales_page_story_pain?: string;
  sales_page_turn_enemy?: string;
  sales_page_value_stack?: string;
  sales_page_transformation?: string;
  sales_page_proof?: string;
  sales_page_faq?: string;
  sales_page_final_cta?: string;
  // Phase 8D
  about_page_copy?: string;
  problems_page_copy?: string;
  results_page_copy?: string;
  // Phase 8E
  apply_page_copy?: string;
  form_fields?: string;
  form_cta?: string;
  reassurance?: string;
  lead_page_headline?: string;
  lead_page_copy?: string;
  lead_page_cta?: string;
  // Phase 8F
  design_system_colors?: DesignSystemColors;
  design_system_typography?: TypographyScale;
  design_system_components?: string;
  design_system_animations?: string;
  // Phase 9
  conversion_business_type?: string;
  conversion_strategy?: string;
  conversion_funnel?: string;
  conversion_metrics?: string;
  conversion_flow?: string;
  nurture_sequence?: string;
  // Phase 10
  authority_pitch?: string;
  authority_publish_plan?: string;
  authority_product_ecosystem?: string;
  authority_profile_plan?: string;
  authority_partnerships?: string;
  authority_assets?: string;
  authority_gaps?: string;
}

function valueToString(value: Json): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(v => valueToString(v)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function tryParseStructured<T>(value: Json): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value as unknown as T;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') return parsed as T;
    } catch {
      // Not JSON, try YAML-like parsing
      return null;
    }
  }
  return null;
}

export function parseBrandOutputs(outputs: BrandOutput[]): ParsedBrandData {
  const data: ParsedBrandData = {};

  for (const output of outputs) {
    const key = output.output_key as keyof ParsedBrandData;
    const value = output.output_value;

    // Try structured parsing for known structured types
    if (key === 'brand_color_palette') {
      const parsed = tryParseStructured<ColorPalette>(value);
      if (parsed && parsed.primary) {
        data.brand_color_palette = parsed;
        continue;
      }
    }

    if (key === 'brand_typography') {
      const parsed = tryParseStructured<Typography>(value);
      if (parsed && parsed.heading_font) {
        data.brand_typography = parsed;
        continue;
      }
    }

    if (key === 'design_system_colors') {
      const parsed = tryParseStructured<DesignSystemColors>(value);
      if (parsed && parsed.primary) {
        data.design_system_colors = parsed;
        continue;
      }
    }

    if (key === 'design_system_typography') {
      const parsed = tryParseStructured<TypographyScale>(value);
      if (parsed) {
        data.design_system_typography = parsed;
        continue;
      }
    }

    // Default: convert to string
    (data as Record<string, unknown>)[key] = valueToString(value);
  }

  return data;
}

// Group outputs by phase number
export function groupOutputsByPhase(
  outputs: BrandOutput[],
  phases: { id: string; phase_number: string }[]
): Record<string, BrandOutput[]> {
  const phaseIdToNumber: Record<string, string> = {};
  for (const phase of phases) {
    phaseIdToNumber[phase.id] = phase.phase_number;
  }

  const grouped: Record<string, BrandOutput[]> = {};
  for (const output of outputs) {
    const phaseNumber = phaseIdToNumber[output.phase_id] || 'unknown';
    if (!grouped[phaseNumber]) grouped[phaseNumber] = [];
    grouped[phaseNumber].push(output);
  }

  return grouped;
}
