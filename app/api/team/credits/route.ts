import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isOrgOwnerOrAdmin } from '@/lib/permissions';
import { allocateCredits, reclaimCredits, getTeamCreditSummary } from '@/lib/team-credits';
import { logTeamActivity } from '@/lib/team-activity';
import type { FeatureType } from '@/types/database';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    // If requesting all or specific user's credits, must be owner/admin
    if (await isOrgOwnerOrAdmin(orgId, user.id)) {
      if (targetUserId) {
        const { data } = await supabase
          .from('team_credit_allocations')
          .select('*')
          .eq('organization_id', orgId)
          .eq('user_id', targetUserId);
        return NextResponse.json({ allocations: data || [] });
      }
      const summary = await getTeamCreditSummary(orgId);
      return NextResponse.json({ allocations: summary });
    }

    // Regular user: get own allocations only
    const { data } = await supabase
      .from('team_credit_allocations')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', user.id);

    return NextResponse.json({ allocations: data || [] });
  } catch (error) {
    console.error('GET /api/team/credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, feature, amount } = await request.json();
    if (!userId || !feature || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    if (!await isOrgOwnerOrAdmin(orgId, user.id)) {
      return NextResponse.json({ error: 'Only owners and admins can allocate credits' }, { status: 403 });
    }

    const result = await allocateCredits(orgId, user.id, userId, feature as FeatureType, amount);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logTeamActivity(orgId, user.id, 'credits_allocated', userId, {
      feature,
      amount,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/team/credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, feature, amount } = await request.json();
    if (!userId || !feature || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 404 });
    const orgId = membership.organization_id;

    if (!await isOrgOwnerOrAdmin(orgId, user.id)) {
      return NextResponse.json({ error: 'Only owners and admins can reclaim credits' }, { status: 403 });
    }

    const result = await reclaimCredits(orgId, user.id, userId, feature as FeatureType, amount);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logTeamActivity(orgId, user.id, 'credits_reclaimed', userId, {
      feature,
      amount,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/team/credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
