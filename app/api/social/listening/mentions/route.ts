import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/social/listening/mentions - Update mention (read status, flag, notes)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mentionId, isRead, isFlagged, notes } = body;

    if (!mentionId) {
      return NextResponse.json({ error: 'Mention ID required' }, { status: 400 });
    }

    // Build update object
    const updates: any = {};

    if (typeof isRead === 'boolean') {
      updates.is_read = isRead;
    }

    if (typeof isFlagged === 'boolean') {
      updates.is_flagged = isFlagged;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('social_listening_mentions')
      .update(updates)
      .eq('id', mentionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating mention:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PATCH /api/social/listening/mentions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
