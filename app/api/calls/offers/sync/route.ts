import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST — Force sync Brand Engine Phase 4 outputs → offers table
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  try {
    const { syncBrandToOffers } = await import('@/lib/calls/offers/brand-to-offers-sync');
    await syncBrandToOffers(member.organization_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[OffersSync] Failed:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
