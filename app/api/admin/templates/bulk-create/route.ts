import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { TemplateCategory, TemplateContentType, TemplateTier } from '@/types/database';

interface BulkTemplate {
  name: string;
  template_key: string;
  structure: string | null;
  psychology: string | null;
  when_to_use: string[];
  when_not_to_use: string[];
  example_content: string | null;
  prompt_instructions: string | null;
  description: string | null;
  markdown_source: string;
}

function deriveContentType(category: TemplateCategory): TemplateContentType {
  switch (category) {
    case 'hook': return 'hook';
    case 'cta': return 'cta';
    case 'video_script': return 'script';
    default: return 'post';
  }
}

/**
 * POST — batch-insert parsed templates into content_templates.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { templates, category, tier, funnel_stages } = body as {
      templates: BulkTemplate[];
      category: TemplateCategory;
      tier: TemplateTier;
      funnel_stages: string[];
    };

    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return NextResponse.json({ error: 'No templates provided' }, { status: 400 });
    }

    if (!category || !tier) {
      return NextResponse.json({ error: 'Category and tier are required' }, { status: 400 });
    }

    const contentType = deriveContentType(category);

    const rows = templates.map((t) => ({
      template_key: t.template_key,
      name: t.name,
      category,
      content_type: contentType,
      tier,
      funnel_stages: funnel_stages || [],
      structure: t.structure,
      psychology: t.psychology,
      description: t.description,
      when_to_use: t.when_to_use.length > 0 ? t.when_to_use : null,
      when_not_to_use: t.when_not_to_use.length > 0 ? t.when_not_to_use : null,
      example_content: t.example_content,
      prompt_instructions: t.prompt_instructions || `Use the following framework:\n${t.structure || t.name}`,
      markdown_source: t.markdown_source,
      is_active: true,
      is_system: false,
      created_by: user.id,
      updated_by: user.id,
    }));

    const serviceSupabase = createServiceClient();
    const { error: insertError } = await serviceSupabase
      .from('content_templates')
      .insert(rows);

    if (insertError) {
      console.error('Bulk insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      created: rows.length,
    });
  } catch (error) {
    console.error('Error in bulk template create:', error);
    return NextResponse.json({ error: 'Failed to create templates' }, { status: 500 });
  }
}
