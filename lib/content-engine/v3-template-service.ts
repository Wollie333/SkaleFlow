// ============================================================
// V3 Template Service
// Selects proven post templates: Objective → Content Type → Format
// Rotates to avoid repetition. Falls back gracefully.
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { CAMPAIGN_OBJECTIVES, type CampaignObjectiveId } from '@/config/campaign-objectives';

export interface V3Template {
  id: string;
  name: string;
  hook_pattern: string;
  body_structure: string;
  cta_pattern: string;
  caption_template: string | null;
  hashtag_strategy: string | null;
  visual_brief_template: string | null;
  slide_structure: Array<{ slide: number; purpose: string; pattern: string }> | null;
  shot_template: string | null;
  screen_text_template: Array<{ timestamp: string; purpose: string }> | null;
  example_output: Record<string, unknown>;
}

/**
 * Select the best template for a post.
 * Priority: exact (content_type + format + objective_category) → (content_type + format) → (content_type)
 * Rotates by least usage. Avoids already-used templates in this batch.
 */
export async function selectV3Template(
  supabase: SupabaseClient<Database>,
  contentType: number,
  format: string,
  objective: string,
  usedTemplateIds: string[] = []
): Promise<V3Template | null> {
  const objectiveConfig = CAMPAIGN_OBJECTIVES[objective as CampaignObjectiveId];
  const category = objectiveConfig?.category || 'growth';

  // Attempt 1: Exact match (content_type + format + objective_category)
  const exact = await queryTemplates(supabase, { content_type: contentType, format, objective_category: category }, usedTemplateIds);
  if (exact) return exact;

  // Attempt 2: Same content_type + format, any category
  const formatMatch = await queryTemplates(supabase, { content_type: contentType, format }, usedTemplateIds);
  if (formatMatch) return formatMatch;

  // Attempt 3: Same content_type, any format
  const typeMatch = await queryTemplates(supabase, { content_type: contentType }, usedTemplateIds);
  if (typeMatch) return typeMatch;

  // Attempt 4: Any template for this format (different content type)
  const anyFormat = await queryTemplates(supabase, { format }, usedTemplateIds);
  if (anyFormat) return anyFormat;

  return null;
}

/**
 * Increment usage count after a template is used.
 */
export async function markTemplateUsed(
  supabase: SupabaseClient<Database>,
  templateId: string
): Promise<void> {
  const { data } = await supabase
    .from('content_templates')
    .select('usage_count')
    .eq('id', templateId)
    .single();

  await supabase
    .from('content_templates')
    .update({
      usage_count: (data?.usage_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId);
}

/**
 * Build a template-aware AI prompt section.
 * Gives the AI the exact structure to follow instead of open-ended generation.
 */
export function buildTemplatePromptBlock(template: V3Template): string {
  const sections: string[] = [];

  sections.push(`## Template: "${template.name}"`);
  sections.push(`Follow this proven structure EXACTLY. Personalize it — don't change the structure.`);

  sections.push(`\n### Hook Pattern\n${template.hook_pattern}`);
  sections.push(`\n### Body Structure\n${template.body_structure}`);
  sections.push(`\n### CTA Pattern\n${template.cta_pattern}`);

  if (template.caption_template) {
    sections.push(`\n### Caption Pattern\n${template.caption_template}`);
  }
  if (template.hashtag_strategy) {
    sections.push(`\n### Hashtag Strategy\n${template.hashtag_strategy}`);
  }
  if (template.visual_brief_template) {
    sections.push(`\n### Visual Brief Pattern\n${template.visual_brief_template}`);
  }
  if (template.slide_structure) {
    sections.push(`\n### Slide Structure`);
    for (const slide of template.slide_structure) {
      sections.push(`Slide ${slide.slide} (${slide.purpose}): ${slide.pattern}`);
    }
  }
  if (template.shot_template) {
    sections.push(`\n### Shot Directions\n${template.shot_template}`);
  }
  if (template.screen_text_template) {
    sections.push(`\n### On-Screen Text`);
    for (const item of template.screen_text_template) {
      sections.push(`${item.timestamp}: ${item.purpose}`);
    }
  }

  // Include example output as reference
  if (template.example_output && Object.keys(template.example_output).length > 0) {
    sections.push(`\n### Reference Example (for tone and quality — do NOT copy)`);
    for (const [key, val] of Object.entries(template.example_output)) {
      if (typeof val === 'string') {
        sections.push(`${key}: "${val}"`);
      }
    }
  }

  return sections.join('\n');
}

// ── Internal ──

async function queryTemplates(
  supabase: SupabaseClient<Database>,
  filters: { content_type?: number; format?: string; objective_category?: string },
  excludeIds: string[] = []
): Promise<V3Template | null> {
  let query = supabase
    .from('content_templates')
    .select('*')
    .eq('is_active', true);

  if (filters.content_type !== undefined) query = query.eq('v3_content_type', filters.content_type);
  if (filters.format) query = query.eq('format', filters.format);
  if (filters.objective_category) query = query.eq('objective_category', filters.objective_category);
  if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.join(',')})`);

  const { data } = await query.order('usage_count', { ascending: true }).limit(1);
  if (!data || data.length === 0) return null;

  return mapRow(data[0]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): V3Template {
  return {
    id: row.id,
    name: row.name,
    hook_pattern: row.hook_pattern,
    body_structure: row.body_structure,
    cta_pattern: row.cta_pattern,
    caption_template: row.caption_template,
    hashtag_strategy: row.hashtag_strategy,
    visual_brief_template: row.visual_brief_template,
    slide_structure: row.slide_structure,
    shot_template: row.shot_template,
    screen_text_template: row.screen_text_template,
    example_output: row.example_output || {},
  };
}
