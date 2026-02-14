import { NextResponse } from 'next/server';
import { processAuthorityNotifications } from '@/lib/authority/notifications';

// Cron endpoint — processes follow-ups, deadlines, embargoes, overdue payments
export async function GET() {
  try {
    const result = await processAuthorityNotifications();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Authority notification processing failed:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
