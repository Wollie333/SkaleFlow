import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

    const { data: templates } = await supabase
      .from('content_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, name, format, template_fields } = await request.json();

    if (!organizationId || !name || !format) {
      return NextResponse.json({ error: 'organizationId, name, and format are required' }, { status: 400 });
    }

    const { data: template, error } = await supabase
      .from('content_templates')
      .insert({
        organization_id: organizationId,
        name,
        format,
        template_fields: template_fields || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { templateId } = await request.json();

    await supabase.from('content_templates').delete().eq('id', templateId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
