import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { listCalendars } from '@/lib/google-calendar';

export async function GET() {
  try {
    const supabase = await createClient();
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

    // Check if Google Calendar is connected first
    const serviceClient = createServiceClient();
    const { data: integration } = await serviceClient
      .from('google_integrations')
      .select('calendar_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!integration) {
      // Not connected - return empty calendars list
      return NextResponse.json({
        calendars: [],
        selectedCalendarId: 'primary',
      });
    }

    const calendars = await listCalendars(user.id);

    return NextResponse.json({
      calendars,
      selectedCalendarId: integration?.calendar_id || 'primary',
    });
  } catch (error) {
    console.error('List calendars error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to list calendars';
    // If it's a "not connected" error, return empty list instead of 500
    if (errorMessage.includes('not connected')) {
      return NextResponse.json({
        calendars: [],
        selectedCalendarId: 'primary',
      });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
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

    const { calendarId } = await request.json();

    if (!calendarId || typeof calendarId !== 'string') {
      return NextResponse.json({ error: 'calendarId is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('google_integrations')
      .update({ calendar_id: calendarId, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      console.error('Update calendar_id error:', error);
      return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
    }

    return NextResponse.json({ success: true, calendarId });
  } catch (error) {
    console.error('PATCH calendars error:', error);
    return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
  }
}
