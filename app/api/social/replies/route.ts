import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List saved replies for the user's org
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const category = request.nextUrl.searchParams.get('category');
  const search = request.nextUrl.searchParams.get('search');

  let query = supabase
    .from('saved_replies')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('use_count', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,body.ilike.%${search}%,shortcut.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching saved replies:', error);
    return NextResponse.json({ error: 'Failed to fetch saved replies' }, { status: 500 });
  }

  return NextResponse.json({ replies: data || [] });
}

// POST - Create a new saved reply
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const body = await request.json();
  const { name, body: replyBody, category, shortcut } = body;

  if (!name?.trim() || !replyBody?.trim()) {
    return NextResponse.json({ error: 'Name and body are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_replies')
    .insert({
      organization_id: membership.organization_id,
      created_by: user.id,
      name: name.trim(),
      body: replyBody.trim(),
      category: category || 'general',
      shortcut: shortcut?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A reply with this shortcut already exists' }, { status: 409 });
    }
    console.error('Error creating saved reply:', error);
    return NextResponse.json({ error: 'Failed to create saved reply' }, { status: 500 });
  }

  return NextResponse.json({ reply: data }, { status: 201 });
}
