import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { TemplateCategory, TemplateTier } from '@/types/database';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    const serviceSupabase = createServiceClient();

    let query = serviceSupabase
      .from('content_templates')
      .select('*, template_stage_mappings(*)')
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category as TemplateCategory);
    }
    if (tier) {
      query = query.eq('tier', tier as TemplateTier);
    }
    if (active === 'true') {
      query = query.eq('is_active', true);
    } else if (active === 'false') {
      query = query.eq('is_active', false);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,template_key.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Failed to fetch templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

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
    const { template, stageMappings } = body;

    if (!template?.template_key || !template?.name || !template?.category || !template?.content_type || !template?.prompt_instructions) {
      return NextResponse.json({ error: 'Missing required fields: template_key, name, category, content_type, prompt_instructions' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Insert template
    const { data: newTemplate, error: templateError } = await serviceSupabase
      .from('content_templates')
      .insert({
        template_key: template.template_key,
        name: template.name,
        category: template.category,
        content_type: template.content_type,
        format_category: template.format_category || null,
        tier: template.tier || 'core_rotation',
        funnel_stages: template.funnel_stages || [],
        structure: template.structure || null,
        psychology: template.psychology || null,
        description: template.description || null,
        when_to_use: template.when_to_use || null,
        when_not_to_use: template.when_not_to_use || null,
        example_content: template.example_content || null,
        prompt_instructions: template.prompt_instructions,
        output_format: template.output_format || null,
        markdown_source: template.markdown_source || null,
        hook_rules: template.hook_rules || null,
        body_rules: template.body_rules || null,
        cta_rules: template.cta_rules || null,
        tone_voice: template.tone_voice || null,
        formatting_rules: template.formatting_rules || null,
        is_standardised: !!(template.hook_rules && template.body_rules && template.cta_rules && template.tone_voice && template.formatting_rules),
        is_active: template.is_active !== false,
        sort_order: template.sort_order || 0,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single();

    if (templateError || !newTemplate) {
      console.error('Failed to create template:', templateError);
      return NextResponse.json({ error: templateError?.message || 'Failed to create template' }, { status: 500 });
    }

    // Insert stage mappings if provided
    if (Array.isArray(stageMappings) && stageMappings.length > 0) {
      const mappingRows = stageMappings.map((m: { funnel_stage: string; storybrand_stage: string; is_primary?: boolean; confidence_score?: number }) => ({
        template_id: newTemplate.id,
        funnel_stage: m.funnel_stage,
        storybrand_stage: m.storybrand_stage,
        is_primary: m.is_primary || false,
        confidence_score: m.confidence_score || 80,
      }));

      const { error: mappingError } = await serviceSupabase
        .from('template_stage_mappings')
        .insert(mappingRows);

      if (mappingError) {
        console.error('Failed to create stage mappings:', mappingError);
      }
    }

    return NextResponse.json({ success: true, id: newTemplate.id });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const { id, template, stageMappings } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Update template fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    const allowedFields = [
      'template_key', 'name', 'category', 'content_type', 'format_category',
      'tier', 'funnel_stages', 'structure', 'psychology', 'description',
      'when_to_use', 'when_not_to_use', 'example_content', 'prompt_instructions',
      'output_format', 'markdown_source', 'is_active', 'sort_order',
      'hook_rules', 'body_rules', 'cta_rules', 'tone_voice', 'formatting_rules',
      'is_standardised',
    ];

    for (const field of allowedFields) {
      if (template && field in template) {
        updateData[field] = template[field];
      }
    }

    const { error: updateError } = await serviceSupabase
      .from('content_templates')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update template:', updateError);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    // Upsert stage mappings if provided
    if (Array.isArray(stageMappings)) {
      // Delete existing mappings
      await serviceSupabase
        .from('template_stage_mappings')
        .delete()
        .eq('template_id', id);

      // Insert new mappings
      if (stageMappings.length > 0) {
        const mappingRows = stageMappings.map((m: { funnel_stage: string; storybrand_stage: string; is_primary?: boolean; confidence_score?: number }) => ({
          template_id: id,
          funnel_stage: m.funnel_stage,
          storybrand_stage: m.storybrand_stage,
          is_primary: m.is_primary || false,
          confidence_score: m.confidence_score || 80,
        }));

        const { error: mappingError } = await serviceSupabase
          .from('template_stage_mappings')
          .insert(mappingRows);

        if (mappingError) {
          console.error('Failed to upsert stage mappings:', mappingError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}
