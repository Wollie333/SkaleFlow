import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await params;
  const body = await request.json();
  const { reason, details } = body;

  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const { data: flag, error } = await supabase
    .from('pr_directory_flags')
    .insert({
      contact_id: contactId,
      flagged_by: user.id,
      reason,
      details: details || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already flagged this contact' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(flag, { status: 201 });
}
