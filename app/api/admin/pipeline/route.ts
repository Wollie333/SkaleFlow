import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendBookingEmail } from '@/lib/resend';
import type { PipelineStage } from '@/types/database';

const STAGE_LABELS: Record<PipelineStage, string> = {
  application: 'Application',
  declined: 'Declined',
  approved: 'Approved',
  booking_made: 'Booking Made',
  lost: 'Lost',
  won: 'Won',
};

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');

    const serviceSupabase = createServiceClient();
    let query = serviceSupabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (stage) {
      query = query.eq('pipeline_stage', stage as PipelineStage);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Failed to fetch applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Pipeline GET error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationId, pipeline_stage, admin_notes, action } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Get current application
    const { data: currentApp, error: fetchError } = await serviceSupabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !currentApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Handle user activation
    if (action === 'activate') {
      if (currentApp.pipeline_stage !== 'won') {
        return NextResponse.json({ error: 'Can only activate users from Won stage' }, { status: 400 });
      }

      if (currentApp.activated_user_id) {
        return NextResponse.json({ error: 'User already activated for this application' }, { status: 400 });
      }

      // Check if email already exists
      const { data: existingUser } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('email', currentApp.email)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
      }

      // Generate random password
      const randomPassword = crypto.randomUUID().slice(0, 16) + 'Aa1!';

      // Create Supabase Auth user
      const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
        email: currentApp.email,
        password: randomPassword,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        console.error('Failed to create auth user:', authError);
        return NextResponse.json({ error: authError?.message || 'Failed to create user account' }, { status: 500 });
      }

      const newUserId = authData.user.id;

      // Create users record
      const { error: userError } = await serviceSupabase
        .from('users')
        .insert({
          id: newUserId,
          email: currentApp.email,
          full_name: currentApp.full_name,
          role: 'client',
          approved: true,
          email_verified: true,
        });

      if (userError) {
        await serviceSupabase.auth.admin.deleteUser(newUserId);
        console.error('Failed to create user record:', userError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }

      // Create organization
      const slug = currentApp.business_name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: org, error: orgError } = await serviceSupabase
        .from('organizations')
        .insert({
          name: currentApp.business_name,
          slug: slug || `org-${newUserId.slice(0, 8)}`,
          owner_id: newUserId,
        })
        .select()
        .single();

      if (orgError || !org) {
        console.error('Failed to create organization:', orgError);
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
      }

      // Create org_members record
      await serviceSupabase.from('org_members').insert({
        organization_id: org.id,
        user_id: newUserId,
        role: 'owner',
      });

      // Create subscription (Foundation tier)
      const { data: foundationTier } = await serviceSupabase
        .from('subscription_tiers')
        .select('id')
        .eq('slug', 'foundation')
        .single();

      if (foundationTier) {
        await serviceSupabase.from('subscriptions').insert({
          organization_id: org.id,
          tier_id: foundationTier.id,
          status: 'active',
        });
      }

      // Send password reset email
      await serviceSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: currentApp.email,
      });

      // Update application with activated user ID
      await serviceSupabase
        .from('applications')
        .update({ activated_user_id: newUserId })
        .eq('id', applicationId);

      // Log activity
      await serviceSupabase.from('application_activity').insert({
        application_id: applicationId,
        action: 'user_activated',
        description: `User account activated by ${userData.full_name}. Password reset email sent to ${currentApp.email}.`,
        performed_by: user.id,
        metadata: { user_id: newUserId, organization_id: org.id },
      });

      return NextResponse.json({
        success: true,
        message: 'User account created and password reset email sent',
        userId: newUserId,
      });
    }

    // Handle create booking link (generates token + returns URL, does NOT email)
    if (action === 'create_booking') {
      if (currentApp.pipeline_stage !== 'approved') {
        return NextResponse.json({ error: 'Can only create booking links for approved applications' }, { status: 400 });
      }

      // Check for existing pending meeting first
      const { data: existingMeeting } = await serviceSupabase
        .from('meetings')
        .select('booking_token, token_expires_at')
        .eq('application_id', applicationId)
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

      // Cancel any expired pending meetings
      await serviceSupabase
        .from('meetings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('application_id', applicationId)
        .eq('status', 'pending');

      // Generate new booking token
      const bookingToken = crypto.randomUUID();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

      const { error: meetingError } = await serviceSupabase
        .from('meetings')
        .insert({
          application_id: applicationId,
          host_user_id: user.id,
          attendee_email: currentApp.email,
          attendee_name: currentApp.full_name,
          booking_token: bookingToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          status: 'pending',
        });

      if (meetingError) {
        console.error('Failed to create meeting:', meetingError);
        return NextResponse.json({ error: 'Failed to create booking link' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        bookingUrl: `${siteUrl}/book/${bookingToken}`,
        isExisting: false,
      });
    }

    // Handle send booking email (sends email for the current pending booking)
    if (action === 'send_booking_email') {
      if (currentApp.pipeline_stage !== 'approved') {
        return NextResponse.json({ error: 'Can only send booking emails for approved applications' }, { status: 400 });
      }

      const { data: pendingMeeting } = await serviceSupabase
        .from('meetings')
        .select('booking_token, token_expires_at')
        .eq('application_id', applicationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pendingMeeting || new Date(pendingMeeting.token_expires_at) < new Date()) {
        return NextResponse.json({ error: 'No active booking link found. Generate one first.' }, { status: 400 });
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const bookingUrl = `${siteUrl}/book/${pendingMeeting.booking_token}`;

      try {
        await sendBookingEmail({
          to: currentApp.email,
          applicantName: currentApp.full_name,
          bookingUrl,
        });
      } catch (emailError) {
        console.error('Failed to send booking email:', emailError);
        return NextResponse.json({ error: 'Failed to send email. Check Resend configuration.' }, { status: 500 });
      }

      await serviceSupabase.from('application_activity').insert({
        application_id: applicationId,
        action: 'booking_email_sent',
        description: `Booking invite emailed to ${currentApp.email} by ${userData.full_name}`,
        performed_by: user.id,
        metadata: { booking_token: pendingMeeting.booking_token },
      });

      return NextResponse.json({
        success: true,
        message: `Invite email sent to ${currentApp.email}`,
      });
    }

    // Handle stage change
    if (pipeline_stage && pipeline_stage !== currentApp.pipeline_stage) {
      const fromLabel = STAGE_LABELS[currentApp.pipeline_stage as PipelineStage] || currentApp.pipeline_stage;
      const toLabel = STAGE_LABELS[pipeline_stage as PipelineStage] || pipeline_stage;

      await serviceSupabase
        .from('applications')
        .update({ pipeline_stage })
        .eq('id', applicationId);

      await serviceSupabase.from('application_activity').insert({
        application_id: applicationId,
        action: 'stage_changed',
        from_stage: currentApp.pipeline_stage,
        to_stage: pipeline_stage,
        description: `Moved from ${fromLabel} to ${toLabel} by ${userData.full_name}`,
        performed_by: user.id,
      });

      // When moving to "approved", send booking email
      if (pipeline_stage === 'approved') {
        let bookingWarning: string | undefined;

        // Check if admin has Google Calendar connected
        const { data: googleIntegration } = await serviceSupabase
          .from('google_integrations')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!googleIntegration) {
          bookingWarning = 'Google Calendar not connected. Connect it in Settings to enable automatic meeting booking.';
        }

        // Generate booking token and create meeting
        const bookingToken = crypto.randomUUID();
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

        const { error: meetingError } = await serviceSupabase
          .from('meetings')
          .insert({
            application_id: applicationId,
            host_user_id: user.id,
            attendee_email: currentApp.email,
            attendee_name: currentApp.full_name,
            booking_token: bookingToken,
            token_expires_at: tokenExpiresAt.toISOString(),
            status: 'pending',
          });

        if (meetingError) {
          console.error('Failed to create meeting:', meetingError);
        } else {
          // Send booking email
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          const bookingUrl = `${siteUrl}/book/${bookingToken}`;

          try {
            await sendBookingEmail({
              to: currentApp.email,
              applicantName: currentApp.full_name,
              bookingUrl,
            });

            await serviceSupabase.from('application_activity').insert({
              application_id: applicationId,
              action: 'booking_email_sent',
              description: `Booking email sent to ${currentApp.email}`,
              performed_by: user.id,
              metadata: { booking_token: bookingToken },
            });
          } catch (emailError) {
            console.error('Failed to send booking email:', emailError);
            bookingWarning = 'Application approved but booking email failed to send. Check email configuration.';
          }
        }

        if (bookingWarning) {
          return NextResponse.json({ success: true, warning: bookingWarning });
        }
      }
    }

    // Handle notes update
    if (admin_notes !== undefined && admin_notes !== currentApp.admin_notes) {
      await serviceSupabase
        .from('applications')
        .update({ admin_notes })
        .eq('id', applicationId);

      await serviceSupabase.from('application_activity').insert({
        application_id: applicationId,
        action: 'note_updated',
        description: `Admin notes updated by ${userData.full_name}`,
        performed_by: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pipeline PATCH error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
