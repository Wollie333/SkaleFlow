import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { initializeCreditBalance } from '@/lib/ai/credits';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('=== DEBUG: Admin Users API ===');
    console.log('Auth user ID:', user.id);
    console.log('adminUser:', adminUser);
    console.log('adminError:', adminError);

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();

    // Fetch subscription tiers
    const { data: tiers, error: tiersError } = await serviceSupabase
      .from('subscription_tiers')
      .select('id, name, slug, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (tiersError) {
      console.error('Failed to fetch tiers:', tiersError);
      return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
    }

    // Get all users with their org membership info + subscription tier
    const { data: users, error } = await serviceSupabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        approved,
        ai_beta_enabled,
        created_at,
        last_login_at,
        org_members!org_members_user_id_fkey (
          organization_id,
          role,
          team_role,
          organizations (
            name,
            subscriptions (
              tier_id,
              subscription_tiers (
                id,
                name
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log('Users fetched:', users?.length);

    return NextResponse.json({ users: users || [], tiers: tiers || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, approved, tierId, action, aiBetaEnabled } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // Handle AI Beta toggle
    if (typeof aiBetaEnabled === 'boolean') {
      const { error: betaError } = await serviceSupabase
        .from('users')
        .update({ ai_beta_enabled: aiBetaEnabled })
        .eq('id', userId);

      if (betaError) {
        console.error('Failed to update AI beta status:', betaError);
        return NextResponse.json({ error: 'Failed to update AI beta status' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Handle pause (revoke approval)
    if (action === 'pause') {
      const { error: pauseError } = await serviceSupabase
        .from('users')
        .update({ approved: false })
        .eq('id', userId);

      if (pauseError) {
        console.error('Failed to pause user:', pauseError);
        return NextResponse.json({ error: 'Failed to pause user' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Handle delete user
    if (action === 'delete') {
      // Nullify FK references that could block deletion
      await Promise.all([
        serviceSupabase.from('org_members').update({ invited_by: null }).eq('invited_by', userId),
        serviceSupabase.from('invitations').update({ invited_by: null }).eq('invited_by', userId),
        serviceSupabase.from('brand_phases').update({ locked_by: null }).eq('locked_by', userId),
        serviceSupabase.from('brand_conversations').update({ user_id: null }).eq('user_id', userId),
        serviceSupabase.from('brand_playbooks').update({ generated_by: null }).eq('generated_by', userId),
        serviceSupabase.from('content_items').update({ assigned_to: null }).eq('assigned_to', userId),
        serviceSupabase.from('content_items').update({ approved_by: null }).eq('approved_by', userId),
        serviceSupabase.from('ai_usage').update({ user_id: null }).eq('user_id', userId),
      ]);

      // Delete related records: org_members, subscriptions, then user
      const { data: mem } = await serviceSupabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (mem) {
        await serviceSupabase
          .from('subscriptions')
          .delete()
          .eq('organization_id', mem.organization_id);

        await serviceSupabase
          .from('org_members')
          .delete()
          .eq('user_id', userId);

        await serviceSupabase
          .from('organizations')
          .delete()
          .eq('owner_id', userId);
      }

      const { error: deleteError } = await serviceSupabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Failed to delete user:', deleteError);
        const msg = deleteError.message?.includes('violates foreign key')
          ? 'Cannot delete user: still referenced by other records. Please run migration 070 first.'
          : 'Failed to delete user';
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error('Failed to delete auth user:', authDeleteError);
      }

      return NextResponse.json({ success: true });
    }

    // Handle org assignment
    if (action === 'assign_org') {
      const { orgName } = body;
      if (!orgName || typeof orgName !== 'string') {
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
      }

      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Create the organization
      const { data: newOrg, error: orgError } = await serviceSupabase
        .from('organizations')
        .insert({
          name: orgName,
          slug,
          owner_id: userId,
        })
        .select('id')
        .single();

      if (orgError) {
        console.error('Failed to create org:', orgError);
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
      }

      // Link user to the org
      const { error: memberError } = await serviceSupabase
        .from('org_members')
        .insert({
          organization_id: newOrg.id,
          user_id: userId,
          role: 'owner' as const,
        });

      if (memberError) {
        console.error('Failed to add org member:', memberError);
        return NextResponse.json({ error: 'Failed to link user to organization' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle tier assignment
    if (tierId !== undefined) {
      const effectiveTierId = tierId || null;

      // Find user's organization via org_members
      const { data: membership, error: memberError } = await serviceSupabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (memberError || !membership) {
        console.error('Failed to find user org:', memberError);
        return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
      }

      const orgId = membership.organization_id;

      // Check if a subscription already exists for this org
      const { data: existingSub } = await serviceSupabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await serviceSupabase
          .from('subscriptions')
          .update({ tier_id: effectiveTierId, updated_at: new Date().toISOString() })
          .eq('id', existingSub.id);

        if (updateError) {
          console.error('Failed to update subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
        }
      } else {
        // Insert new subscription
        const { error: insertError } = await serviceSupabase
          .from('subscriptions')
          .insert({
            organization_id: orgId,
            tier_id: effectiveTierId,
            status: 'active' as const,
          });

        if (insertError) {
          console.error('Failed to create subscription:', insertError);
          return NextResponse.json({ error: 'Failed to assign tier' }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true });
    }

    // Handle approval toggle
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'approved (boolean) or tierId is required' },
        { status: 400 }
      );
    }

    const { error } = await serviceSupabase
      .from('users')
      .update({ approved })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // When approving, assign Foundation tier by default
    if (approved) {
      const { data: foundationTier } = await serviceSupabase
        .from('subscription_tiers')
        .select('id')
        .eq('slug', 'foundation')
        .maybeSingle();

      if (foundationTier) {
        const { data: mem } = await serviceSupabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (mem) {
          const { data: existingSub } = await serviceSupabase
            .from('subscriptions')
            .select('id')
            .eq('organization_id', mem.organization_id)
            .limit(1)
            .maybeSingle();

          if (existingSub) {
            await serviceSupabase
              .from('subscriptions')
              .update({ tier_id: foundationTier.id, updated_at: new Date().toISOString() })
              .eq('id', existingSub.id);
          } else {
            await serviceSupabase
              .from('subscriptions')
              .insert({
                organization_id: mem.organization_id,
                tier_id: foundationTier.id,
                status: 'active' as const,
              });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify caller is super_admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, email, password, organizationName, tierId } = body;

    // Validate required fields
    if (!fullName || !email || !password || !organizationName || !tierId) {
      return NextResponse.json(
        { error: 'All fields are required: fullName, email, password, organizationName, tierId' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceClient();

    // Check duplicate email
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Validate tier exists and get monthly_credits
    const { data: tier, error: tierError } = await serviceSupabase
      .from('subscription_tiers')
      .select('id, monthly_credits')
      .eq('id', tierId)
      .eq('is_active', true)
      .single();

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Step 1: Create Auth user
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Failed to create auth user:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // Step 2: Create users row
    const { error: userError } = await serviceSupabase
      .from('users')
      .insert({
        id: newUserId,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        role: 'client',
        approved: true,
      });

    if (userError) {
      console.error('Failed to create user row:', userError);
      // Rollback: delete auth user
      await serviceSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      );
    }

    // Step 3: Create organization
    const slug = organizationName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substring(2, 6);

    const { data: newOrg, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({
        name: organizationName.trim(),
        slug,
        owner_id: newUserId,
      })
      .select('id')
      .single();

    if (orgError || !newOrg) {
      console.error('Failed to create organization:', orgError);
      // Rollback: delete user + auth
      await serviceSupabase.from('users').delete().eq('id', newUserId);
      await serviceSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Step 4: Create org_members row
    const { error: memberError } = await serviceSupabase
      .from('org_members')
      .insert({
        organization_id: newOrg.id,
        user_id: newUserId,
        role: 'owner' as const,
      });

    if (memberError) {
      console.error('Failed to create org member:', memberError);
    }

    // Step 5: Create subscription
    const { error: subError } = await serviceSupabase
      .from('subscriptions')
      .insert({
        organization_id: newOrg.id,
        tier_id: tier.id,
        status: 'active' as const,
      });

    if (subError) {
      console.error('Failed to create subscription:', subError);
    }

    // Step 6: Initialize credit balance
    try {
      await initializeCreditBalance(newOrg.id, tier.monthly_credits || 0);
    } catch (creditError) {
      console.error('Failed to initialize credits:', creditError);
    }

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
