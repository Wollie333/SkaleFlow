import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

// POST — Record that an offer was presented during a call (creates/updates CRM deal)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const body = await request.json();
  const { offerId, offerName, priceValue, priceDisplay, currency } = body as {
    offerId: string;
    offerName?: string;
    priceValue?: number;
    priceDisplay?: string;
    currency?: string;
  };

  if (!offerId) {
    return NextResponse.json({ error: 'offerId required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get the call
  const { data: call } = await supabase
    .from('calls')
    .select('id, organization_id, crm_contact_id, host_user_id')
    .eq('room_code', roomCode)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  if (!call.crm_contact_id) {
    return NextResponse.json({ success: true, dealId: null, message: 'No CRM contact linked to call' });
  }

  const valueCents = Math.round((priceValue || 0) * 100);
  const productsData = [
    { offer_id: offerId, name: offerName || 'Untitled', price: priceDisplay || '', value: priceValue || 0, currency: currency || 'ZAR' },
  ] as unknown as Json;

  // Check if there's already an open deal for this offer + contact (re-present = update)
  const { data: existingDeals } = await supabase
    .from('crm_deals')
    .select('id, products')
    .eq('organization_id', call.organization_id)
    .eq('contact_id', call.crm_contact_id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  const matchingDeal = existingDeals?.find(d => {
    const products = d.products as unknown as Array<{ offer_id?: string }>;
    return Array.isArray(products) && products.some(p => p.offer_id === offerId);
  });

  if (matchingDeal) {
    // Update existing deal with new price (re-present / discount)
    await supabase.from('crm_deals').update({
      value_cents: valueCents,
      products: productsData,
      updated_at: new Date().toISOString(),
    }).eq('id', matchingDeal.id);

    // Log re-present activity
    try {
      await supabase.from('crm_activity').insert({
        organization_id: call.organization_id,
        contact_id: call.crm_contact_id,
        deal_id: matchingDeal.id,
        activity_type: 'note',
        title: `Offer re-presented: ${offerName}`,
        description: `Offer "${offerName}" was re-presented at ${priceDisplay || 'no price'} during a video call.`,
        performed_by: call.host_user_id,
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, dealId: matchingDeal.id, updated: true });
  }

  // Create new CRM deal
  const { data: deal, error } = await supabase
    .from('crm_deals')
    .insert({
      organization_id: call.organization_id,
      title: offerName || 'Untitled Offer',
      contact_id: call.crm_contact_id,
      value_cents: valueCents,
      probability: 50,
      status: 'open',
      assigned_to: call.host_user_id,
      products: productsData,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create CRM deal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log CRM activity
  try {
    await supabase.from('crm_activity').insert({
      organization_id: call.organization_id,
      contact_id: call.crm_contact_id,
      deal_id: deal.id,
      activity_type: 'deal_created',
      title: `Offer presented: ${offerName}`,
      description: `"${offerName}" (${priceDisplay || 'no price'}) was presented during a video call. Deal created automatically.`,
      performed_by: call.host_user_id,
    });
  } catch {
    // Non-blocking
  }

  return NextResponse.json({ success: true, dealId: deal.id });
}
