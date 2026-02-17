import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST — clone a template into the user's org
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Fetch the source template
  const { data: source, error: fetchError } = await supabase
    .from('call_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !source) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Allow optional name override from body
  let cloneName = `${source.name} (Copy)`;
  try {
    const body = await request.json();
    if (body.name) cloneName = body.name;
  } catch {
    // No body — use default name
  }

  const { data: clone, error } = await supabase
    .from('call_templates')
    .insert({
      organization_id: member.organization_id,
      name: cloneName,
      description: source.description,
      call_type: source.call_type,
      is_system: false,
      phases: source.phases,
      opening_script: source.opening_script,
      closing_script: source.closing_script,
      objection_bank: source.objection_bank,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(clone, { status: 201 });
}
