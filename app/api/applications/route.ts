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

    // Insert application (backward compat)
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

    // Dual-write: also create a pipeline_contact in the application pipeline
    try {
      // Find super_admin user
      const { data: superAdmin } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1)
        .single();

      if (superAdmin) {
        // Find super_admin's org
        const { data: adminMembership } = await serviceSupabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', superAdmin.id)
          .limit(1)
          .single();

        if (adminMembership) {
          // Find application pipeline for that org
          const { data: appPipeline } = await serviceSupabase
            .from('pipelines')
            .select('id')
            .eq('organization_id', adminMembership.organization_id)
            .eq('pipeline_type', 'application')
            .limit(1)
            .single();

          if (appPipeline) {
            // Find first stage (sort_order 0)
            const { data: firstStage } = await serviceSupabase
              .from('pipeline_stages')
              .select('id')
              .eq('pipeline_id', appPipeline.id)
              .order('sort_order', { ascending: true })
              .limit(1)
              .single();

            if (firstStage) {
              const { data: pipelineContact } = await serviceSupabase
                .from('pipeline_contacts')
                .insert({
                  pipeline_id: appPipeline.id,
                  stage_id: firstStage.id,
                  full_name: full_name.trim(),
                  email: email.trim().toLowerCase(),
                  phone: phone.trim(),
                  company: business_name.trim(),
                  custom_fields: {
                    website_url: website_url?.trim() || '',
                    team_size,
                    annual_revenue,
                    biggest_challenge: biggest_challenge.trim(),
                    what_tried: what_tried?.trim() || '',
                    why_applying: why_applying.trim(),
                    application_id: application.id,
                  },
                })
                .select('id')
                .single();

              if (pipelineContact) {
                // Log activity
                await serviceSupabase.from('pipeline_activity').insert({
                  pipeline_id: appPipeline.id,
                  contact_id: pipelineContact.id,
                  event_type: 'contact_created',
                  metadata: {
                    source: 'public_application_form',
                    application_id: application.id,
                  },
                });
              }
            }
          }
        }
      }
    } catch (dualWriteError) {
      // Fail gracefully — the legacy application was still created
      console.error('Failed to dual-write to pipeline_contacts:', dualWriteError);
    }

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
