import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/social/competitors - Get all competitors
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching competitors:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in GET /api/social/competitors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/social/competitors - Create a new competitor
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      website,
      logo_url,
      linkedin_handle,
      facebook_handle,
      instagram_handle,
      twitter_handle,
      tiktok_handle,
      youtube_handle,
      track_mentions,
      track_performance,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('competitors')
      .insert({
        organization_id: userData.organization_id,
        name,
        description,
        website,
        logo_url,
        linkedin_handle,
        facebook_handle,
        instagram_handle,
        twitter_handle,
        tiktok_handle,
        youtube_handle,
        track_mentions: track_mentions ?? true,
        track_performance: track_performance ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating competitor:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in POST /api/social/competitors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
