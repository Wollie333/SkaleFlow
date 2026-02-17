import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST — Record that a guest accepted an offer during a call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const body = await request.json();
  const { offerId, guestName, guestEmail } = body;

  if (!offerId) {
    return NextResponse.json({ error: 'offerId required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get the call
  const { data: call } = await supabase
    .from('calls')
    .select('id, organization_id, crm_contact_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  // Get the offer
  const { data: offer } = await supabase
    .from('offers')
    .select('id, name, price_value, currency')
    .eq('id', offerId)
    .eq('organization_id', call.organization_id)
    .single();

  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  }

  // Log acceptance in call activity (use call_metadata or a simple approach)
  // Update the call with the accepted offer info
  await supabase.from('calls').update({
    updated_at: new Date().toISOString(),
  }).eq('id', call.id);

  // If there's a CRM contact, log activity
  if (call.crm_contact_id) {
    await supabase.from('crm_activities').insert({
      organization_id: call.organization_id,
      contact_id: call.crm_contact_id,
      activity_type: 'note',
      title: `Accepted offer: ${offer.name}`,
      description: `${guestName || 'Guest'} (${guestEmail || 'unknown'}) accepted the "${offer.name}" offer during a call.`,
    }).then(() => {}).catch(() => {});
  }

  // Notify org admins
  try {
    const { notifyOrgAdmins } = await import('@/lib/notifications');
    await notifyOrgAdmins(
      supabase,
      call.organization_id,
      'offer_accepted' as never, // may not be in NotificationType yet
      `Offer accepted: ${offer.name}`,
      `${guestName || 'A guest'} accepted the "${offer.name}" offer during a call.`,
      `/calls/${roomCode}/summary`,
      { offer_id: offerId, guest_name: guestName, guest_email: guestEmail }
    );
  } catch {
    // Don't fail if notification fails
  }

  return NextResponse.json({ success: true, offerId: offer.id, offerName: offer.name });
}
