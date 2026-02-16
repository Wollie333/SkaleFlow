import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendNotificationEmail } from '@/lib/resend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { emailContent } = body;

  const serviceClient = createServiceClient();

  const { data: call } = await serviceClient
    .from('calls')
    .select('id, crm_contact_id, title')
    .eq('room_code', roomCode)
    .single();

  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  // Get guest email
  let guestEmail: string | null = null;
  if (call.crm_contact_id) {
    const { data: contact } = await serviceClient
      .from('crm_contacts')
      .select('email')
      .eq('id', call.crm_contact_id)
      .single();
    guestEmail = contact?.email || null;
  }

  if (!guestEmail) {
    // Try from participants
    const { data: participant } = await serviceClient
      .from('call_participants')
      .select('guest_email')
      .eq('call_id', call.id)
      .eq('role', 'guest')
      .not('guest_email', 'is', null)
      .limit(1)
      .single();
    guestEmail = participant?.guest_email || null;
  }

  if (!guestEmail) {
    return NextResponse.json({ error: 'No guest email found' }, { status: 400 });
  }

  const content = emailContent || (await serviceClient
    .from('call_summaries')
    .select('follow_up_email_draft')
    .eq('call_id', call.id)
    .single()
  ).data?.follow_up_email_draft;

  if (!content) {
    return NextResponse.json({ error: 'No email content' }, { status: 400 });
  }

  try {
    await sendNotificationEmail({
      to: guestEmail,
      title: `Follow-up: ${call.title}`,
      body: content.replace(/\n/g, '<br>'),
    });

    return NextResponse.json({ sent: true, to: guestEmail });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
