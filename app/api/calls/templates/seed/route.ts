import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ALL_DEFAULT_TEMPLATES } from '@/lib/calls/templates/defaults';
import type { CallType, Json } from '@/types/database';

// POST — seed system templates (admin only, idempotent by name)
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

  // Get existing system template names
  const { data: existing } = await serviceClient
    .from('call_templates')
    .select('name')
    .eq('is_system', true);

  const existingNames = new Set((existing || []).map(t => t.name));

  // Only insert templates that don't already exist (by name)
  const newTemplates = ALL_DEFAULT_TEMPLATES.filter(t => !existingNames.has(t.name));

  if (newTemplates.length === 0) {
    return NextResponse.json({ message: 'All system templates already exist', count: existingNames.size });
  }

  const inserts = newTemplates.map(t => ({
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
  return NextResponse.json({ seeded: data?.length || 0, total: existingNames.size + (data?.length || 0) }, { status: 201 });
}
