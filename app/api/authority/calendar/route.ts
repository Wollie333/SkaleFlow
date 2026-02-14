import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAuthorityAccess } from '@/lib/authority/auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = request.nextUrl.searchParams.get('organizationId');
  const startDate = request.nextUrl.searchParams.get('startDate');
  const endDate = request.nextUrl.searchParams.get('endDate');

  if (!orgId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const access = await checkAuthorityAccess(supabase, user.id, orgId);
  if (!access.authorized) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  const db = access.queryClient;

  let query = db
    .from('authority_calendar_events')
    .select(`
      *,
      authority_pipeline_cards(opportunity_name, category)
    `)
    .eq('organization_id', orgId)
    .order('event_date', { ascending: true });

  if (startDate) query = query.gte('event_date', startDate);
  if (endDate) query = query.lte('event_date', endDate);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
