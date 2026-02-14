import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Inbound email webhook endpoint.
 * Called by email service (e.g. SendGrid Inbound Parse, Resend) when
 * an email is received at the org's BCC address.
 */
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  // Parse the webhook payload
  // Format depends on provider — this handles a generic JSON format
  const body = await request.json();
  const {
    to, // BCC address
    from, // sender email
    from_name, // sender name
    subject,
    text, // plain text body
    date, // email date
  } = body;

  if (!to || !from) {
    return NextResponse.json({ error: 'Missing to/from' }, { status: 400 });
  }

  // Find the email config by BCC address
  const { data: config } = await supabase
    .from('authority_email_config')
    .select('organization_id, bcc_enabled')
    .eq('bcc_address', to)
    .single();

  if (!config || !config.bcc_enabled) {
    return NextResponse.json({ error: 'Unknown BCC address or disabled' }, { status: 404 });
  }

  const orgId = config.organization_id;

  // Find matching contact by email
  const { data: contact } = await supabase
    .from('authority_contacts')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', from)
    .single();

  // Find related cards (if contact exists)
  let cardId: string | null = null;
  if (contact) {
    const { data: card } = await supabase
      .from('authority_pipeline_cards')
      .select('id')
      .eq('organization_id', orgId)
      .eq('contact_id', contact.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    cardId = card?.id || null;

    // Update contact warmth and last_contact_date
    await supabase
      .from('authority_contacts')
      .update({
        last_contact_date: new Date().toISOString(),
        warmth: 'active' as const,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id);
  }

  // Create correspondence record (card_id is required — skip if no matching card)
  if (cardId) {
    await supabase.from('authority_correspondence').insert({
      organization_id: orgId,
      card_id: cardId,
      contact_id: contact?.id || null,
      type: 'email' as const,
      direction: 'inbound' as const,
      email_subject: subject || '(No subject)',
      email_from: from,
      email_body_text: text || '',
      occurred_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      summary: `BCC capture from ${from_name || from}: ${subject || '(No subject)'}`,
    });
  }

  return NextResponse.json({ success: true });
}
