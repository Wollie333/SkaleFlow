import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/social/inbox - Mark interaction as read/unread, assign, flag
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
    const { interactionId, isRead, assignedTo, isFlagged } = body;

    if (!interactionId) {
      return NextResponse.json({ error: 'Interaction ID required' }, { status: 400 });
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof isRead === 'boolean') {
      updates.is_read = isRead;
    }

    if (assignedTo !== undefined) {
      updates.assigned_to = assignedTo;
    }

    if (typeof isFlagged === 'boolean') {
      updates.is_flagged = isFlagged;
    }

    // Update interaction
    const { data, error } = await supabase
      .from('social_interactions')
      .update(updates)
      .eq('id', interactionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating interaction:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PATCH /api/social/inbox:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
