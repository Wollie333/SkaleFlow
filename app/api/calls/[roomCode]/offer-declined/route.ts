import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST — Record that a guest declined an offer (updates CRM deal to lost)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const body = await request.json();
  const { offerId, guestName, reason } = body as {
    offerId: string;
    guestName?: string;
    reason?: string;
  };

  if (!offerId) {
    return NextResponse.json({ error: 'offerId required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: call } = await supabase
    .from('calls')
    .select('id, organization_id, crm_contact_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  if (!call.crm_contact_id) {
    return NextResponse.json({ success: true, message: 'No CRM contact linked' });
  }

  // Find the open deal for this offer
  const { data: deals } = await supabase
    .from('crm_deals')
    .select('id, products')
    .eq('organization_id', call.organization_id)
    .eq('contact_id', call.crm_contact_id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  const matchingDeal = deals?.find(d => {
    const products = d.products as unknown as Array<{ offer_id?: string }>;
    return Array.isArray(products) && products.some(p => p.offer_id === offerId);
  });

  if (matchingDeal) {
    await supabase.from('crm_deals').update({
      status: 'lost',
      lost_reason: reason || 'Declined during call',
      probability: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', matchingDeal.id);
  }

  // Log CRM activity
  try {
    await supabase.from('crm_activity').insert({
      organization_id: call.organization_id,
      contact_id: call.crm_contact_id,
      deal_id: matchingDeal?.id || null,
      activity_type: 'note',
      title: 'Offer declined',
      description: `${guestName || 'Guest'} declined an offer during a video call. Reason: ${reason || 'No reason given'}`,
    });
  } catch {
    // Non-blocking
  }

  return NextResponse.json({ success: true });
}
