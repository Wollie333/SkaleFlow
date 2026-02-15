import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveConnection } from '@/lib/canva/token-manager';
import { CanvaClient } from '@/lib/canva/client';

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

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const active = await getActiveConnection(membership.organization_id);
  if (!active) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || undefined;
  const continuation = searchParams.get('continuation') || undefined;

  try {
    const client = new CanvaClient(active.accessToken);
    const result = await client.listDesigns({ query, continuation });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[canva-designs] List failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to list designs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
