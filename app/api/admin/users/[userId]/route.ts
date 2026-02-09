import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { initializeCreditBalance } from '@/lib/ai/credits';

const FEATURE_LABELS: Record<string, string> = {
  brand_chat: 'Brand Engine',
  brand_engine: 'Brand Engine',
  brand_import: 'Brand Import',
  content_generation: 'Content Generation',
  logo_generation: 'Logo Generation',
  ad_generation: 'Ad Generation',
};

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminUser?.role !== 'super_admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { user };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = await params;
    const serviceSupabase = createServiceClient();

    // Phase 1: User record + org membership (parallel)
    const [userResult, memberResult] = await Promise.all([
      serviceSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),
      serviceSupabase
        .from('org_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            slug,
            owner_id,
            created_at,
            subscriptions (
              id,
              status,
              tier_id,
              created_at,
              updated_at,
              subscription_tiers (
                id,
                name,
                slug,
                monthly_credits
              )
            )
          )
        `)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle(),
    ]);

    if (userResult.error || !userResult.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userResult.data;
    const membership = memberResult.data;
    const orgId = membership?.organization_id || null;

    // Phase 2: All org-dependent queries (parallel)
    // Wrap Supabase queries with .then() to convert PromiseLike → Promise
    const wrap = <T,>(query: PromiseLike<T>): Promise<T> => Promise.resolve(query);
    const empty = <T,>(val: T): Promise<{ data: T }> => Promise.resolve({ data: val });

    const [
      creditResult,
      aiUsageResult,
      contentResult,
      brandResult,
      txResult,
      recentContentResult,
      notifResult,
      batchResult,
    ] = await Promise.all([
      // Credit balance
      orgId
        ? wrap(serviceSupabase.from('credit_balances').select('*').eq('organization_id', orgId).maybeSingle())
        : empty(null as null),
      // AI usage
      orgId
        ? wrap(serviceSupabase.from('ai_usage').select('feature, credits_charged').eq('organization_id', orgId))
        : empty([] as Array<{ feature: string; credits_charged: number }>),
      // Content items
      orgId
        ? wrap(serviceSupabase.from('content_items').select('id, status').eq('organization_id', orgId))
        : empty([] as Array<{ id: string; status: string }>),
      // Brand phases
      orgId
        ? wrap(serviceSupabase.from('brand_phases').select('id, phase_number, phase_name, status, updated_at').eq('organization_id', orgId).order('sort_order', { ascending: true }))
        : empty([] as Array<{ id: string; phase_number: string; phase_name: string; status: string; updated_at: string }>),
      // Credit transactions
      orgId
        ? wrap(serviceSupabase.from('credit_transactions').select('id, transaction_type, credits_amount, description, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(20))
        : empty([] as Array<{ id: string; transaction_type: string; credits_amount: number; description: string | null; created_at: string }>),
      // Recent content
      orgId
        ? wrap(serviceSupabase.from('content_items').select('id, topic, status, platforms, created_at, updated_at').eq('organization_id', orgId).order('updated_at', { ascending: false }).limit(20))
        : empty([] as Array<{ id: string; topic: string | null; status: string; platforms: string[]; created_at: string; updated_at: string }>),
      // Notifications
      wrap(serviceSupabase.from('notifications').select('id, type, title, body, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)),
      // Generation batches
      orgId
        ? wrap(serviceSupabase.from('generation_batches').select('id, status, total_items, completed_items, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(20))
        : empty([] as Array<{ id: string; status: string; total_items: number; completed_items: number; created_at: string }>),
    ]);

    // Build organization response
    const org = membership?.organizations as Record<string, unknown> | null;
    const subscriptions = org?.subscriptions as Array<Record<string, unknown>> | undefined;
    const sub = subscriptions?.[0] || null;
    const tier = sub?.subscription_tiers as Record<string, unknown> | null;

    const organization = org ? {
      id: org.id,
      name: org.name,
      slug: org.slug,
      owner_id: org.owner_id,
      created_at: org.created_at,
      membership_role: membership?.role,
      subscription: sub ? {
        id: sub.id,
        status: sub.status,
        tier_id: sub.tier_id,
        created_at: sub.created_at,
        tier: tier ? {
          id: tier.id,
          name: tier.name,
          slug: tier.slug,
          monthly_credits: tier.monthly_credits,
        } : null,
      } : null,
      credits: creditResult.data || null,
    } : null;

    // Build credits by feature
    const featureMap = new Map<string, { credits_charged: number; request_count: number }>();
    for (const row of (aiUsageResult.data || [])) {
      const key = row.feature || 'unknown';
      const existing = featureMap.get(key) || { credits_charged: 0, request_count: 0 };
      existing.credits_charged += row.credits_charged || 0;
      existing.request_count += 1;
      featureMap.set(key, existing);
    }
    const creditsByFeature = Array.from(featureMap.entries()).map(([feature, data]) => ({
      feature,
      label: FEATURE_LABELS[feature] || feature,
      credits_charged: data.credits_charged,
      request_count: data.request_count,
    })).sort((a, b) => b.credits_charged - a.credits_charged);

    // Build content stats
    const contentItems = contentResult.data || [];
    const contentStats = {
      total: contentItems.length,
      published: contentItems.filter(i => i.status === 'published').length,
      draft: contentItems.filter(i => i.status === 'draft').length,
      scheduled: contentItems.filter(i => i.status === 'scheduled').length,
      approved: contentItems.filter(i => i.status === 'approved').length,
      pending_review: contentItems.filter(i => i.status === 'pending_review').length,
    };

    // Build brand progress from brand_phases table
    const PHASE_NAMES: Record<string, string> = {
      '1': 'Brand Foundation',
      '2': 'Market Intelligence',
      '3': 'Audience Deep-Dive',
      '4': 'Offer Architecture',
      '5': 'Positioning & Category',
      '6': 'Messaging Framework',
      '7': 'Brand Identity',
      '8': 'Design System',
      '9': 'Growth Engine',
      '10': 'Authority Playbook',
    };

    const brandPhases = brandResult.data || [];
    const brandProgress = Object.entries(PHASE_NAMES).map(([num, fallbackName]) => {
      const phase = brandPhases.find(p => p.phase_number === num);
      return {
        phase_number: Number(num),
        phase_name: phase?.phase_name || fallbackName,
        status: phase?.status || 'not_started',
      };
    });

    // Build merged activity timeline
    const activity: ActivityItem[] = [];

    // Credit transactions -> activity
    for (const tx of (txResult.data || [])) {
      activity.push({
        id: `tx-${tx.id}`,
        type: 'credit_transaction',
        title: tx.transaction_type === 'ai_usage_deduction' ? 'AI Usage' :
               tx.transaction_type === 'monthly_allocation' ? 'Monthly Credits' :
               tx.transaction_type === 'topup_purchase' ? 'Credit Top-Up' :
               tx.transaction_type,
        description: tx.description || `${tx.credits_amount > 0 ? '+' : ''}${tx.credits_amount} credits`,
        timestamp: tx.created_at,
        metadata: { transaction_type: tx.transaction_type, credits_amount: tx.credits_amount },
      });
    }

    // Recent content -> activity
    for (const item of (recentContentResult.data || [])) {
      const platform = item.platforms?.[0] || 'Unknown';
      activity.push({
        id: `content-${item.id}`,
        type: 'content',
        title: item.topic || 'Untitled content',
        description: `${platform} — ${item.status}`,
        timestamp: item.updated_at || item.created_at,
        metadata: { status: item.status, platform },
      });
    }

    // Notifications -> activity
    for (const n of (notifResult.data || [])) {
      activity.push({
        id: `notif-${n.id}`,
        type: 'notification',
        title: n.title,
        description: n.body || '',
        timestamp: n.created_at,
        metadata: { notification_type: n.type },
      });
    }

    // Generation batches -> activity
    for (const b of (batchResult.data || [])) {
      activity.push({
        id: `batch-${b.id}`,
        type: 'generation_batch',
        title: `Content generation batch`,
        description: `${b.completed_items}/${b.total_items} items — ${b.status}`,
        timestamp: b.created_at,
        metadata: { status: b.status, total: b.total_items, completed: b.completed_items },
      });
    }

    // Sort by timestamp descending
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      user: userData,
      organization,
      creditsByFeature,
      contentStats,
      brandProgress,
      activity: activity.slice(0, 50),
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId } = await params;
    const body = await request.json();
    const { approved, tierId, action, orgName, role } = body;

    const serviceSupabase = createServiceClient();

    // Verify target user exists
    const { data: targetUser, error: targetError } = await serviceSupabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle pause
    if (action === 'pause') {
      const { error } = await serviceSupabase
        .from('users')
        .update({ approved: false })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: 'Failed to pause user' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Handle delete
    if (action === 'delete') {
      const { data: mem } = await serviceSupabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (mem) {
        await serviceSupabase.from('subscriptions').delete().eq('organization_id', mem.organization_id);
        await serviceSupabase.from('org_members').delete().eq('user_id', userId);
        await serviceSupabase.from('organizations').delete().eq('owner_id', userId);
      }

      const { error } = await serviceSupabase.from('users').delete().eq('id', userId);
      if (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
      }

      const { error: authErr } = await serviceSupabase.auth.admin.deleteUser(userId);
      if (authErr) console.error('Failed to delete auth user:', authErr);

      return NextResponse.json({ success: true });
    }

    // Handle org assignment
    if (action === 'assign_org') {
      if (!orgName || typeof orgName !== 'string') {
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
      }

      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data: newOrg, error: orgError } = await serviceSupabase
        .from('organizations')
        .insert({ name: orgName, slug, owner_id: userId })
        .select('id')
        .single();

      if (orgError) {
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
      }

      const { error: memberError } = await serviceSupabase
        .from('org_members')
        .insert({ organization_id: newOrg.id, user_id: userId, role: 'owner' as const });

      if (memberError) {
        return NextResponse.json({ error: 'Failed to link user to organization' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle role change
    if (role !== undefined) {
      const validRoles = ['client', 'team_member', 'super_admin'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const { error } = await serviceSupabase
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Handle tier assignment
    if (tierId !== undefined) {
      const effectiveTierId = tierId || null;

      const { data: membership } = await serviceSupabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
      }

      const orgId = membership.organization_id;
      const { data: existingSub } = await serviceSupabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        const { error } = await serviceSupabase
          .from('subscriptions')
          .update({ tier_id: effectiveTierId, updated_at: new Date().toISOString() })
          .eq('id', existingSub.id);
        if (error) return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
      } else {
        const { error } = await serviceSupabase
          .from('subscriptions')
          .insert({ organization_id: orgId, tier_id: effectiveTierId, status: 'active' as const });
        if (error) return NextResponse.json({ error: 'Failed to assign tier' }, { status: 500 });
      }

      // Initialize credit balance if needed
      if (effectiveTierId) {
        const { data: tier } = await serviceSupabase
          .from('subscription_tiers')
          .select('monthly_credits')
          .eq('id', effectiveTierId)
          .single();

        if (tier) {
          try {
            await initializeCreditBalance(orgId, tier.monthly_credits || 0);
          } catch (e) {
            console.error('Failed to initialize credits:', e);
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    // Handle approval toggle
    if (typeof approved === 'boolean') {
      const { error } = await serviceSupabase
        .from('users')
        .update({ approved })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }

      // Auto-assign Foundation tier on approval
      if (approved) {
        const { data: foundationTier } = await serviceSupabase
          .from('subscription_tiers')
          .select('id, monthly_credits')
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
                .insert({ organization_id: mem.organization_id, tier_id: foundationTier.id, status: 'active' as const });
            }

            try {
              await initializeCreditBalance(mem.organization_id, foundationTier.monthly_credits || 0);
            } catch (e) {
              console.error('Failed to initialize credits:', e);
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
