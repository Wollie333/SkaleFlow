import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getEventStatus } from '@/lib/google-calendar';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Fetch all scheduled meetings that have a Google Calendar event
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('id, application_id, host_user_id, google_event_id')
    .eq('status', 'scheduled')
    .not('google_event_id', 'is', null);

  if (error || !meetings) {
    return NextResponse.json(
      { error: 'Failed to fetch meetings', details: error?.message },
      { status: 500 }
    );
  }

  let meetingsCancelled = 0;
  const errors: string[] = [];

  // Group by host_user_id to batch OAuth client usage
  const byHost: Record<string, typeof meetings> = {};
  for (const meeting of meetings) {
    if (!byHost[meeting.host_user_id]) {
      byHost[meeting.host_user_id] = [];
    }
    byHost[meeting.host_user_id].push(meeting);
  }

  for (const [hostUserId, hostMeetings] of Object.entries(byHost)) {
    for (const meeting of hostMeetings) {
      try {
        const status = await getEventStatus(hostUserId, meeting.google_event_id!);

        if (status === 'cancelled' || status === 'not_found') {
          // Update meeting status to cancelled
          await supabase
            .from('meetings')
            .update({
              status: 'cancelled' as const,
              updated_at: new Date().toISOString(),
            })
            .eq('id', meeting.id);

          // Log activity on the linked application
          await supabase.from('application_activity').insert({
            application_id: meeting.application_id,
            action: 'meeting_cancelled',
            description: 'Meeting cancelled — Google Calendar event was removed',
            metadata: ({
              meeting_id: meeting.id,
              google_event_id: meeting.google_event_id,
              reason: status === 'cancelled' ? 'event_cancelled' : 'event_deleted',
              sync_source: 'calendar_sync_cron',
            }) as unknown as Json,
          });

          meetingsCancelled++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Meeting ${meeting.id}: ${message}`);
      }
    }
  }

  return NextResponse.json({
    meetingsChecked: meetings.length,
    meetingsCancelled,
    errors: errors.length > 0 ? errors : undefined,
  });
}
