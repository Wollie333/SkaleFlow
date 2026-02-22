import type { Json } from '@/types/database';
import { VARIABLE_DISPLAY_NAMES as CONTENT_DISPLAY_NAMES } from '@/lib/content-engine/brand-variable-categories';

/**
 * Human-friendly display names for ALL ~85 brand variables.
 * Merges the content-engine map with additional variables from phases 5-10.
 */
export const VARIABLE_DISPLAY_NAMES: Record<string, string> = {
  ...CONTENT_DISPLAY_NAMES,
  // Phase 1 extras
  brand_vision: 'Brand Vision',
  brand_mission: 'Brand Mission',
  brand_non_negotiables: 'Non-Negotiables',
  // Phase 3 extras
  enemy_type: 'Enemy Type',
  // Phase 4 extras
  offer_exclusions: 'What\'s Excluded',
  offer_transformation_before: 'Before Transformation',
  offer_transformation_after: 'After Transformation',
  // Phase 5
  positioning_statement: 'Positioning Statement',
  differentiation_statement: 'Unique Differentiator',
  category: 'Market Category',
  competitive_landscape: 'Competitive Landscape',
  // Phase 6 extras
  industry_terms_embrace: 'Industry Terms (Embrace)',
  industry_terms_reject: 'Industry Terms (Reject)',
  // Phase 7
  brand_logo_primary: 'Primary Logo',
  brand_logo_dark: 'Logo (Dark Background)',
  brand_logo_light: 'Logo (Light Background)',
  brand_logo_icon: 'Logo Icon / Favicon',
  brand_mood_board: 'Mood Board',
  brand_patterns: 'Patterns & Textures',
  brand_logo_url: 'Brand Logo', // legacy alias
  brand_color_palette: 'Color Palette',
  brand_typography: 'Typography',
  visual_mood: 'Visual Mood',
  imagery_direction: 'Imagery Direction',
  brand_elements: 'Brand Elements',
  visual_inspirations: 'Visual Inspirations',
  brand_visual_assets_summary: 'Visual Assets Summary',
  brand_visual_guidelines: 'Visual Guidelines',
  brand_tagline: 'Brand Tagline',
  // Phase 8
  design_system_colors: 'Design System Colors',
  design_system_typography: 'Design System Typography',
  design_system_components: 'Component Patterns',
  design_system_animations: 'Animation & Motion',
  // Phase 9
  website_role: 'Website Role',
  primary_conversion: 'Primary Conversion',
  secondary_conversion: 'Secondary Conversion',
  traffic_sources: 'Traffic Sources',
  website_sitemap: 'Website Sitemap',
  user_journey: 'User Journey',
  content_themes: 'Content Themes',
  content_pillars: 'Content Pillars',
  beliefs_to_teach: 'Beliefs to Teach',
  homepage_hero: 'Homepage Hero',
  homepage_problem: 'Homepage Problem Section',
  homepage_solution: 'Homepage Solution',
  homepage_who_we_help: 'Who We Help',
  homepage_proof: 'Social Proof',
  homepage_why_us: 'Why Choose Us',
  homepage_final_cta: 'Homepage Final CTA',
  sales_page_hero: 'Sales Page Hero',
  sales_page_story_pain: 'Sales Page Story & Pain',
  sales_page_turn_enemy: 'Sales Page Enemy Turn',
  sales_page_value_stack: 'Value Stack',
  sales_page_transformation: 'Sales Transformation',
  sales_page_proof: 'Sales Page Proof',
  sales_page_faq: 'FAQ Section',
  sales_page_final_cta: 'Sales Page Final CTA',
  about_page_copy: 'About Page Copy',
  problems_page_copy: 'Problems Page Copy',
  results_page_copy: 'Results Page Copy',
  apply_page_copy: 'Application Page Copy',
  form_fields: 'Form Fields',
  form_cta: 'Form CTA',
  reassurance: 'Reassurance Copy',
  lead_page_headline: 'Lead Page Headline',
  lead_page_copy: 'Lead Page Copy',
  lead_page_cta: 'Lead Page CTA',
  // Phase 10
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

/**
 * Parse a YAML-like string into key-value pairs for preview display.
 * Handles multi-line values, arrays (- items), and block scalars (|, |-).
 */
export function parseYamlPreview(yaml: string): Array<{ key: string; value: string }> {
  const pairs: Array<{ key: string; value: string }> = [];
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);

    if (keyMatch && !line.startsWith('  ')) {
      if (currentKey) {
        pairs.push({ key: currentKey, value: currentLines.join('\n').trim() });
      }
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value === '' || value === '|' || value === '|-') {
        currentLines = [];
      } else {
        currentLines = [value];
      }
    } else if (currentKey) {
      const trimmed = line.startsWith('  - ') ? line.substring(4).trim() : line.trim();
      if (trimmed) {
        currentLines.push(trimmed);
      }
    }
  }

  if (currentKey) {
    pairs.push({ key: currentKey, value: currentLines.join('\n').trim() });
  }

  return pairs;
}

/**
 * Convert an output key to a human-friendly display name.
 * Uses the VARIABLE_DISPLAY_NAMES map first, falls back to title-case.
 */
export function formatOutputKey(key: string): string {
  if (VARIABLE_DISPLAY_NAMES[key]) return VARIABLE_DISPLAY_NAMES[key];
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format bytes to a human-readable file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Render a brand output value (string, array, or object) as a React-friendly node.
 * Returns a string representation for use in non-React contexts;
 * for JSX rendering, use the component-level formatOutputValue instead.
 */
export function formatOutputValueText(value: Json): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
  return String(value);
}
