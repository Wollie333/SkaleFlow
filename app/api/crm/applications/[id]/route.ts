import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/** Check if user is super_admin or in an org with a super_admin */
async function canAccessApplicationPipeline(userId: string) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const [{ data: userData }, { data: membership }] = await Promise.all([
    supabase.from('users').select('role').eq('id', userId).single(),
    supabase.from('org_members').select('organization_id').eq('user_id', userId).single(),
  ]);

  if (userData?.role === 'super_admin') return true;

  if (membership?.organization_id) {
    const { count } = await serviceClient
      .from('org_members')
      .select('user_id, users!inner(role)', { count: 'exact', head: true })
      .eq('organization_id', membership.organization_id)
      .eq('users.role', 'super_admin');
    return (count || 0) > 0;
  }

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await canAccessApplicationPipeline(user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();

    // Fetch application
    const { data: application, error: appError } = await serviceSupabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Fetch activity log
    const { data: activity, error: activityError } = await serviceSupabase
      .from('application_activity')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: true });

    if (activityError) {
      console.error('Failed to fetch activity:', activityError);
    }

    // Fetch meeting for this application (if exists)
    const { data: meeting } = await serviceSupabase
      .from('meetings')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If there's an activated user, get their info
    let activatedUser = null;
    if (application.activated_user_id) {
      const { data: userInfo } = await serviceSupabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', application.activated_user_id)
        .single();
      activatedUser = userInfo;
    }

    // Enrich activity entries with performer names
    const performerIds = Array.from(new Set((activity || []).filter(a => a.performed_by).map(a => a.performed_by)));
    let performers: Record<string, string> = {};
    if (performerIds.length > 0) {
      const { data: users } = await serviceSupabase
        .from('users')
        .select('id, full_name')
        .in('id', performerIds as string[]);
      if (users) {
        performers = Object.fromEntries(users.map(u => [u.id, u.full_name]));
      }
    }

    const enrichedActivity = (activity || []).map(a => ({
      ...a,
      performer_name: a.performed_by ? performers[a.performed_by] || 'Unknown' : null,
    }));

    return NextResponse.json({
      application,
      activity: enrichedActivity,
      activatedUser,
      meeting: meeting || null,
    });
  } catch (error) {
    console.error('Pipeline detail GET error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
