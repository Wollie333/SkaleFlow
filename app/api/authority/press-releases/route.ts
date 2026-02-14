import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const { data, error } = await supabase
    .from('authority_press_releases')
    .select('id, organization_id, title, subtitle, status, card_id, published_at, created_at, updated_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { organizationId, title, subtitle, body_content, headline, card_id } = body;
  if (!organizationId || !title) return NextResponse.json({ error: 'organizationId and title required' }, { status: 400 });

  const { data, error } = await supabase
    .from('authority_press_releases')
    .insert({
      organization_id: organizationId,
      title,
      subtitle: subtitle || null,
      headline: headline || title,
      body_content: body_content || '',
      status: 'draft' as const,
      card_id: card_id || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
