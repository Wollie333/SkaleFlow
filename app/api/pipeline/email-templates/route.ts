import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase.from('email_templates').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.organizationId || !body.name || !body.subject || !body.body_html) {
    return NextResponse.json({ error: 'organizationId, name, subject, and body_html required' }, { status: 400 });
  }

  const { data: member } = await supabase.from('org_members').select('role').eq('organization_id', body.organizationId).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase.from('email_templates').insert({
    organization_id: body.organizationId,
    name: body.name,
    subject: body.subject,
    body_html: body.body_html,
    merge_fields: body.merge_fields || [],
    created_by: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
