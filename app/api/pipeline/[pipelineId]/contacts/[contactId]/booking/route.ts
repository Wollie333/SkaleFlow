import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string; contactId: string }> }
) {
  try {
    const { pipelineId, contactId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceSupabase = createServiceClient();

    // Verify pipeline is application type
    const { data: pipeline } = await serviceSupabase
      .from('pipelines')
      .select('pipeline_type, organization_id')
      .eq('id', pipelineId)
      .single();

    if (!pipeline || pipeline.pipeline_type !== 'application') {
      return NextResponse.json({ error: 'Not an application pipeline' }, { status: 400 });
    }

    // Get contact with stage info
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

    // Check for existing pending meeting via pipeline_contact_id
    const { data: existingMeeting } = await serviceSupabase
      .from('meetings')
      .select('booking_token, token_expires_at')
      .eq('pipeline_contact_id', contactId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // If a valid pending meeting exists, return its URL
    if (existingMeeting && new Date(existingMeeting.token_expires_at) > new Date()) {
      return NextResponse.json({
        success: true,
        bookingUrl: `${siteUrl}/book/${existingMeeting.booking_token}`,
        isExisting: true,
      });
    }

    // Cancel any expired pending meetings for this contact
    await serviceSupabase
      .from('meetings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('pipeline_contact_id', contactId)
      .eq('status', 'pending');

    // Generate new booking token
    const bookingToken = crypto.randomUUID();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    const { error: meetingError } = await serviceSupabase
      .from('meetings')
      .insert({
        pipeline_contact_id: contactId,
        host_user_id: user.id,
        attendee_email: contact.email,
        attendee_name: contact.full_name,
        booking_token: bookingToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        status: 'pending',
      });

    if (meetingError) {
      console.error('Failed to create meeting:', meetingError);
      return NextResponse.json({ error: 'Failed to create booking link' }, { status: 500 });
    }

    // Log activity
    await serviceSupabase.from('pipeline_activity').insert({
      contact_id: contactId,
      organization_id: pipeline.organization_id,
      event_type: 'contact_updated',
      metadata: {
        action: 'booking_created',
        pipeline_id: pipelineId,
        booking_token: bookingToken,
      },
      performed_by: user.id,
    });

    return NextResponse.json({
      success: true,
      bookingUrl: `${siteUrl}/book/${bookingToken}`,
      isExisting: false,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
