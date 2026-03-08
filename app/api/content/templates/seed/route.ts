import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ALL_CONTENT_TEMPLATES } from '@/config/content-templates-seed';

// GET — Same as POST (so you can trigger from browser URL bar)
export async function GET() {
  return seedTemplates();
}

// POST — Seed content templates into the database
// Only super_admin can run this
export async function POST() {
  return seedTemplates();
}

async function seedTemplates() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check super admin
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRecord?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert templates (upsert by content_type + format + objective_category + name)
    let inserted = 0;
    let skipped = 0;

    for (const template of ALL_CONTENT_TEMPLATES) {
      // Check if already exists (by v3_content_type + format + objective_category + name)
      const { data: existing } = await supabase
        .from('content_templates')
        .select('id')
        .eq('v3_content_type', template.content_type)
        .eq('format', template.format)
        .eq('objective_category', template.objective_category)
        .eq('name', template.name)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert with required old columns (template_key, content_type TEXT, prompt_instructions)
      // plus all v3 columns
      const templateKey = `v3_${template.content_type}_${template.format}_${template.objective_category}_${inserted + skipped}`;
      const { error } = await supabase.from('content_templates').insert({
        // Required old columns
        template_key: templateKey,
        content_type: 'post',
        category: 'social_framework',
        prompt_instructions: template.body_structure,
        // V3 columns
        v3_content_type: template.content_type,
        format: template.format,
        objective_category: template.objective_category,
        name: template.name,
        description: template.description,
        hook_pattern: template.hook_pattern,
        body_structure: template.body_structure,
        cta_pattern: template.cta_pattern,
        caption_template: template.caption_template,
        hashtag_strategy: template.hashtag_strategy,
        visual_brief_template: template.visual_brief_template,
        slide_structure: template.slide_structure as unknown as import('@/types/database').Json,
        shot_template: template.shot_template,
        screen_text_template: template.screen_text_template as unknown as import('@/types/database').Json,
        example_output: template.example_output as unknown as import('@/types/database').Json,
      });

      if (error) {
        console.error(`Failed to insert template "${template.name}":`, error.message);
      } else {
        inserted++;
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      total: ALL_CONTENT_TEMPLATES.length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
