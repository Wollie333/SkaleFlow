import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/social/hashtags - Get all hashtag sets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization from org_members (reliable pattern)
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('hashtag_sets')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hashtag sets:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in GET /api/social/hashtags:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/social/hashtags - Create a new hashtag set
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, hashtags, platforms, category } = body;

    if (!name || !hashtags || hashtags.length === 0) {
      return NextResponse.json(
        { error: 'Name and hashtags are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('hashtag_sets')
      .insert({
        organization_id: membership.organization_id,
        name,
        description,
        hashtags,
        platforms: platforms || [],
        category: category || 'industry',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating hashtag set:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in POST /api/social/hashtags:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
