import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generatePreCallBrief } from '@/lib/calls/pre-call/brief';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET — cron: generate briefs for calls starting in ~30 min
export async function GET() {
  const supabase = createServiceClient();
  const now = new Date();
  const thirtyMin = new Date(now.getTime() + 30 * 60_000);
  const sixtyMin = new Date(now.getTime() + 60 * 60_000);

  const { data: calls } = await supabase
    .from('calls')
    .select('id, organization_id, host_user_id, title, room_code')
    .eq('call_status', 'scheduled')
    .gte('scheduled_start', thirtyMin.toISOString())
    .lte('scheduled_start', sixtyMin.toISOString());

  if (!calls || calls.length === 0) {
    return NextResponse.json({ generated: 0 });
  }

  let generated = 0;
  for (const call of calls) {
    try {
      const brief = await generatePreCallBrief(call.id, call.organization_id, call.host_user_id);
      if (brief) {
        await createNotification({
          supabase,
          userId: call.host_user_id,
          orgId: call.organization_id,
          type: 'call_reminder',
          title: `Pre-call brief ready: ${call.title}`,
          body: 'Your AI-generated preparation brief is ready. Review it before your call.',
          link: `/calls/${call.room_code}`,
          metadata: { call_id: call.id },
        });
        generated++;
      }
    } catch (err) {
      console.error(`[PreCallBrief] Failed for call ${call.id}:`, err);
    }
  }

  return NextResponse.json({ generated });
}
