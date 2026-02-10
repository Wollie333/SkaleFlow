import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const serviceSupabase = createServiceClient();

    const { data: template, error } = await serviceSupabase
      .from('content_templates')
      .select('*, template_stage_mappings(*)')
      .eq('id', id)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const serviceSupabase = createServiceClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    const allowedFields = [
      'template_key', 'name', 'category', 'content_type', 'format_category',
      'tier', 'funnel_stages', 'structure', 'psychology', 'description',
      'when_to_use', 'when_not_to_use', 'example_content', 'prompt_instructions',
      'output_format', 'markdown_source', 'is_active', 'sort_order',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const { error } = await serviceSupabase
      .from('content_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const serviceSupabase = createServiceClient();

    // Check if template is a system template
    const { data: template } = await serviceSupabase
      .from('content_templates')
      .select('is_system')
      .eq('id', id)
      .single();

    if (template?.is_system) {
      // Soft delete: just deactivate
      const { error } = await serviceSupabase
        .from('content_templates')
        .update({ is_active: false, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: 'Failed to deactivate template' }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: 'deactivated' });
    }

    // Non-system templates: soft delete
    const { error } = await serviceSupabase
      .from('content_templates')
      .update({ is_active: false, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: 'deactivated' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
