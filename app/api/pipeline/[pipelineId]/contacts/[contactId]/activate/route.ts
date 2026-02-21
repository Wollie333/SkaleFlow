import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string; contactId: string }> }
) {
  try {
    const { pipelineId, contactId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify super_admin
    const { data: userData } = await supabase.from('users').select('role, full_name').eq('id', user.id).single();
    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can activate users' }, { status: 403 });
    }

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
      .select('*, pipeline_stages!inner(is_win_stage)')
      .eq('id', contactId)
      .eq('pipeline_id', pipelineId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Must be on win stage
    const stageData = contact.pipeline_stages as unknown as { is_win_stage: boolean };
    if (!stageData?.is_win_stage) {
      return NextResponse.json({ error: 'Contact must be on a win stage to activate' }, { status: 400 });
    }

    const customFields = (contact.custom_fields || {}) as Record<string, unknown>;
    if (customFields.activated_user_id) {
      return NextResponse.json({ error: 'User already activated for this contact' }, { status: 400 });
    }

    if (!contact.email) {
      return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', contact.email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Generate random password
    const randomPassword = crypto.randomUUID().slice(0, 16) + 'Aa1!';

    // Create Supabase Auth user
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: contact.email,
      password: randomPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Failed to create auth user:', authError);
      return NextResponse.json({ error: authError?.message || 'Failed to create user account' }, { status: 500 });
    }

    const newUserId = authData.user.id;
    const businessName = (contact.company || contact.full_name).trim();

    // Create users record
    const { error: userError } = await serviceSupabase
      .from('users')
      .insert({
        id: newUserId,
        email: contact.email,
        full_name: contact.full_name,
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
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: org, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({
        name: businessName,
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
      email: contact.email,
    });

    // Update contact custom_fields with activated_user_id
    await serviceSupabase
      .from('pipeline_contacts')
      .update({
        custom_fields: { ...customFields, activated_user_id: newUserId } as unknown as Json,
      })
      .eq('id', contactId);

    // Log pipeline activity
    await serviceSupabase.from('pipeline_activity').insert({
      contact_id: contactId,
      organization_id: pipeline.organization_id,
      event_type: 'contact_updated',
      metadata: {
        action: 'user_activated',
        user_id: newUserId,
        pipeline_id: pipelineId,
        description: `User account activated by ${userData?.full_name}. Password reset email sent to ${contact.email}.`,
      } as unknown as Json,
      performed_by: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'User account created and password reset email sent',
      userId: newUserId,
    });
  } catch (error) {
    console.error('Activate user error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
