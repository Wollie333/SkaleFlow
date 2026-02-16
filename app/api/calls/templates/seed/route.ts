import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ALL_DEFAULT_TEMPLATES } from '@/lib/calls/templates/defaults';
import type { CallType, Json } from '@/types/database';

// POST — seed system templates (admin only)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check super admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const serviceClient = createServiceClient();

  // Check if system templates already exist
  const { data: existing } = await serviceClient
    .from('call_templates')
    .select('id')
    .eq('is_system', true);

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'System templates already exist', count: existing.length });
  }

  const inserts = ALL_DEFAULT_TEMPLATES.map(t => ({
    organization_id: null as string | null,
    name: t.name,
    description: t.description,
    call_type: t.callType as CallType,
    is_system: true,
    phases: t.phases as unknown as Json,
    opening_script: t.openingScript || null,
    closing_script: t.closingScript || null,
    objection_bank: t.objectionBank as unknown as Json,
  }));

  const { data, error } = await serviceClient
    .from('call_templates')
    .insert(inserts)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seeded: data?.length || 0 }, { status: 201 });
}
