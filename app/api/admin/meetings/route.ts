import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient();

    const { data: meetings, error } = await serviceSupabase
      .from('meetings')
      .select('*, applications(full_name, email, business_name)')
      .order('scheduled_at', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Meetings GET error:', error);
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

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { meetingId, status } = await request.json();

    if (!meetingId || !status) {
      return NextResponse.json({ error: 'meetingId and status are required' }, { status: 400 });
    }

    const validStatuses = ['completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    const { error } = await serviceSupabase
      .from('meetings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', meetingId);

    if (error) {
      console.error('Failed to update meeting:', error);
      return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meetings PATCH error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
