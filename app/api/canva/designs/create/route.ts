import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveConnection } from '@/lib/canva/token-manager';
import { CanvaClient } from '@/lib/canva/client';

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

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const active = await getActiveConnection(membership.organization_id);
  if (!active) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }

  const body = await request.json();
  const { title, width, height } = body;

  if (!title || !width || !height) {
    return NextResponse.json({ error: 'title, width, and height are required' }, { status: 400 });
  }

  try {
    const client = new CanvaClient(active.accessToken);
    const result = await client.createDesign({ title, width, height });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[canva-designs-create] Failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to create design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
