import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendNotificationEmail } from '@/lib/resend';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET — cron: send reminders for calls starting in ~30 min
export async function GET() {
  const supabase = createServiceClient();
  const now = new Date();
  const thirtyMinFromNow = new Date(now.getTime() + 30 * 60_000);
  const fortyFiveMinFromNow = new Date(now.getTime() + 45 * 60_000);

  // Find bookings that need reminders
  const { data: bookings } = await supabase
    .from('call_bookings')
    .select('*, calls(room_code, host_user_id, organization_id)')
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('scheduled_time', thirtyMinFromNow.toISOString())
    .lte('scheduled_time', fortyFiveMinFromNow.toISOString());

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const booking of bookings) {
    const call = booking.calls as { room_code: string; host_user_id: string; organization_id: string } | null;
    if (!call) continue;

    // Send guest reminder email
    try {
      await sendNotificationEmail({
        to: booking.guest_email,
        title: 'Your call starts soon',
        body: `Hi ${booking.guest_name}, your call is starting in about 30 minutes. Click below to join.`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || ''}/call/${call.room_code}`,
      });
    } catch (err) {
      console.error('Reminder email failed:', err);
    }

    // Notify host
    await createNotification({
      supabase,
      userId: call.host_user_id,
      orgId: call.organization_id,
      type: 'call_reminder',
      title: 'Call starting soon',
      body: `Your call with ${booking.guest_name} starts in ~30 minutes.`,
      link: `/calls/${call.room_code}`,
      metadata: { booking_id: booking.id },
    });

    // Mark reminder as sent
    await supabase
      .from('call_bookings')
      .update({ reminder_sent: true })
      .eq('id', booking.id);

    sent++;
  }

  return NextResponse.json({ sent });
}
