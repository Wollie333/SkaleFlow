import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  // Fetch all commercial records for active (non-closed-lost) cards
  const { data: commercials, error } = await supabase
    .from('authority_commercial')
    .select(`
      deal_value,
      engagement_type,
      payment_status,
      authority_pipeline_cards!inner(
        stage_id,
        authority_pipeline_stages!inner(stage_type)
      )
    `)
    .eq('organization_id', organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let totalCommitted = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  for (const c of commercials || []) {
    if (!['paid', 'sponsored'].includes(c.engagement_type)) continue;
    const value = Number(c.deal_value) || 0;

    totalCommitted += value;

    if (c.payment_status === 'paid') {
      totalPaid += value;
    } else if (c.payment_status === 'overdue') {
      totalOverdue += value;
    } else {
      totalPending += value;
    }
  }

  return NextResponse.json({
    total_committed: totalCommitted,
    total_paid: totalPaid,
    total_pending: totalPending,
    total_overdue: totalOverdue,
    currency: 'ZAR',
  });
}
