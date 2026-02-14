import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/social/competitors/[id] - Update a competitor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    // Allow updating all fields except organization_id
    const allowedFields = [
      'name',
      'description',
      'website',
      'logo_url',
      'linkedin_handle',
      'facebook_handle',
      'instagram_handle',
      'twitter_handle',
      'tiktok_handle',
      'youtube_handle',
      'is_active',
      'track_mentions',
      'track_performance',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from('competitors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating competitor:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PATCH /api/social/competitors/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/social/competitors/[id] - Delete a competitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('competitors').delete().eq('id', id);

    if (error) {
      console.error('Error deleting competitor:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/social/competitors/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
