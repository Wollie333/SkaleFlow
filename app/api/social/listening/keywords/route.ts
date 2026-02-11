import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/social/listening/keywords - Get all keywords
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
      .from('social_listening_keywords')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keywords:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in GET /api/social/listening/keywords:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/social/listening/keywords - Create a new keyword
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
    const { keyword, keywordType } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('social_listening_keywords')
      .insert({
        organization_id: userData.organization_id,
        keyword: keyword.trim(),
        keyword_type: keywordType || 'brand',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating keyword:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in POST /api/social/listening/keywords:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
