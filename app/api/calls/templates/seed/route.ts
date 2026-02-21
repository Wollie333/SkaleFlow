import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { ALL_DEFAULT_TEMPLATES } from '@/lib/calls/templates/defaults';
import type { CallType, Json } from '@/types/database';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) };
  }
  return { user };
}

// POST — seed system templates (admin only, idempotent by name)
export async function POST() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

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

// DELETE — purge all system templates from DB, then re-seed fresh (super admin only)
export async function DELETE() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const serviceClient = createServiceClient();

  // Delete all system templates
  const { data: deleted, error: delError } = await serviceClient
    .from('call_templates')
    .delete()
    .eq('is_system', true)
    .select('id');

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  // Re-seed with current defaults
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

  const { data: seeded, error: seedError } = await serviceClient
    .from('call_templates')
    .insert(inserts)
    .select();

  if (seedError) return NextResponse.json({ error: seedError.message }, { status: 500 });

  return NextResponse.json({
    purged: deleted?.length || 0,
    seeded: seeded?.length || 0,
  });
}
