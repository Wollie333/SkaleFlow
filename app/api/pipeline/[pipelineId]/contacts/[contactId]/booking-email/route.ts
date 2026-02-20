import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendBookingEmail } from '@/lib/resend';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string; contactId: string }> }
) {
  try {
    const { pipelineId, contactId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('full_name').eq('id', user.id).single();

    const serviceSupabase = createServiceClient();

    // Verify pipeline is application type
    const { data: pipeline } = await serviceSupabase
      .from('pipelines')
      .select('pipeline_type')
      .eq('id', pipelineId)
      .single();

    if (!pipeline || pipeline.pipeline_type !== 'application') {
      return NextResponse.json({ error: 'Not an application pipeline' }, { status: 400 });
    }

    // Get contact
    const { data: contact } = await serviceSupabase
      .from('pipeline_contacts')
      .select('*, pipeline_stages!inner(name)')
      .eq('id', contactId)
      .eq('pipeline_id', pipelineId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const stageData = contact.pipeline_stages as unknown as { name: string };
    if (stageData?.name !== 'Approved') {
      return NextResponse.json({ error: 'Contact must be on the Approved stage' }, { status: 400 });
    }

    if (!contact.email) {
      return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 });
    }

    // Find pending meeting for this contact
    const { data: pendingMeeting } = await serviceSupabase
      .from('meetings')
      .select('booking_token, token_expires_at')
      .eq('pipeline_contact_id', contactId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pendingMeeting || new Date(pendingMeeting.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'No active booking link found. Create one first.' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const bookingUrl = `${siteUrl}/book/${pendingMeeting.booking_token}`;

    try {
      await sendBookingEmail({
        to: contact.email,
        applicantName: contact.full_name,
        bookingUrl,
      });
    } catch (emailError) {
      console.error('Failed to send booking email:', emailError);
      return NextResponse.json({ error: 'Failed to send email. Check Resend configuration.' }, { status: 500 });
    }

    // Log activity
    await serviceSupabase.from('pipeline_activity').insert({
      pipeline_id: pipelineId,
      contact_id: contactId,
      event_type: 'email_sent',
      metadata: {
        action: 'booking_email_sent',
        booking_token: pendingMeeting.booking_token,
        description: `Booking invite emailed to ${contact.email} by ${userData?.full_name || 'admin'}`,
      },
      performed_by: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Invite email sent to ${contact.email}`,
    });
  } catch (error) {
    console.error('Send booking email error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
