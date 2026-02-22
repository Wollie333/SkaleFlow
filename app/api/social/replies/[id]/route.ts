import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH - Update a saved reply
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Handle use_count increment (from inbox quick-insert)
  if (body.use_count_increment) {
    const { data: existing } = await supabase
      .from('saved_replies')
      .select('use_count')
      .eq('id', id)
      .single();
    await supabase
      .from('saved_replies')
      .update({ use_count: (existing?.use_count || 0) + 1 })
      .eq('id', id);
    return NextResponse.json({ success: true });
  }

  const updates: Record<string, any> = {};

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.body !== undefined) updates.body = body.body.trim();
  if (body.category !== undefined) updates.category = body.category;
  if (body.shortcut !== undefined) updates.shortcut = body.shortcut?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('saved_replies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A reply with this shortcut already exists' }, { status: 409 });
    }
    console.error('Error updating saved reply:', error);
    return NextResponse.json({ error: 'Failed to update saved reply' }, { status: 500 });
  }

  return NextResponse.json({ reply: data });
}

// DELETE - Delete a saved reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('saved_replies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting saved reply:', error);
    return NextResponse.json({ error: 'Failed to delete saved reply' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
