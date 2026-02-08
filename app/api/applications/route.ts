import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      business_name,
      website_url,
      team_size,
      annual_revenue,
      biggest_challenge,
      what_tried,
      why_applying,
    } = body;

    // Validate required fields
    if (!full_name || !email || !phone || !business_name || !team_size || !annual_revenue || !biggest_challenge || !why_applying) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceClient();

    // Insert application
    const { data: application, error: appError } = await serviceSupabase
      .from('applications')
      .insert({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        business_name: business_name.trim(),
        website_url: website_url?.trim() || null,
        team_size,
        annual_revenue,
        biggest_challenge: biggest_challenge.trim(),
        what_tried: what_tried?.trim() || null,
        why_applying: why_applying.trim(),
        pipeline_stage: 'application',
      })
      .select()
      .single();

    if (appError || !application) {
      console.error('Failed to create application:', appError);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // Insert initial activity log entry
    await serviceSupabase.from('application_activity').insert({
      application_id: application.id,
      action: 'submitted',
      to_stage: 'application',
      description: `Application submitted by ${full_name.trim()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
