import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Public endpoint — no auth required
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    organization_id,
    journalist_name,
    journalist_outlet,
    journalist_email,
    journalist_phone,
    topic_of_interest,
    preferred_format,
    deadline,
    additional_notes,
    story_angle_id,
    honeypot, // spam check
  } = body;

  // Honeypot check — if filled, it's a bot
  if (honeypot) {
    return NextResponse.json({ success: true }); // Silent success to fool bots
  }

  if (!organization_id || !journalist_name || !journalist_outlet || !journalist_email || !topic_of_interest) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(journalist_email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Rate limit: 5 inquiries per hour per IP
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await supabase
    .from('authority_press_page_inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organization_id)
    .gte('created_at', oneHourAgo);

  if ((count || 0) >= 20) {
    return NextResponse.json({ error: 'Too many inquiries. Please try again later.' }, { status: 429 });
  }

  // Create inquiry
  const { data: inquiry, error } = await supabase
    .from('authority_press_page_inquiries')
    .insert({
      organization_id,
      journalist_name,
      journalist_outlet,
      journalist_email,
      journalist_phone: journalist_phone || null,
      topic_of_interest,
      preferred_format: preferred_format || null,
      deadline: deadline || null,
      additional_notes: additional_notes || null,
      story_angle_id: story_angle_id || null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create a contact if they don't exist
  const { data: existingContact } = await supabase
    .from('authority_contacts')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('email', journalist_email)
    .single();

  let contactId = existingContact?.id;

  if (!contactId) {
    const { data: newContact } = await supabase
      .from('authority_contacts')
      .insert({
        organization_id,
        full_name: journalist_name,
        outlet: journalist_outlet,
        email: journalist_email,
        phone: journalist_phone || null,
        source: 'press_page_inquiry' as const,
        warmth: 'warm' as const,
      })
      .select('id')
      .single();
    contactId = newContact?.id;
  }

  // Auto-create an inbound pipeline card
  const { data: stages } = await supabase
    .from('authority_pipeline_stages')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('slug', 'inbound')
    .single();

  if (stages && contactId) {
    await supabase.from('authority_pipeline_cards').insert({
      organization_id,
      opportunity_name: `Inbound: ${topic_of_interest.slice(0, 60)}`,
      stage_id: stages.id,
      category: 'media_placement' as const,
      contact_id: contactId,
      notes: `Inquiry from press page.\n\nTopic: ${topic_of_interest}\n${additional_notes ? `Notes: ${additional_notes}` : ''}`,
    });
  }

  // Update inquiry with contact_id
  if (contactId && inquiry) {
    await supabase
      .from('authority_press_page_inquiries')
      .update({ contact_id: contactId })
      .eq('id', inquiry.id);
  }

  return NextResponse.json({ success: true });
}
