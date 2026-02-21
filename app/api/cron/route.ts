import { NextResponse } from 'next/server';

/**
 * Single daily cron dispatcher for Vercel Hobby plan (max 2 crons, daily only).
 * Calls all scheduled endpoints sequentially. Failures are logged but don't stop others.
 */

const CRON_JOBS = [
  '/api/billing/credit-reset',
  '/api/content/analytics/sync',
  '/api/marketing/analytics/sync',
  '/api/content/publish/scheduled',
  '/api/bookings/sync',
  '/api/authority/notifications/process',
  '/api/authority/email/sync',
  '/api/automations/process',
  '/api/content/generate/queue/process',
  '/api/calls/reminders',
  '/api/calls/pre-call-briefs',
  '/api/social/inbox/sync',
];

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const results: { path: string; status: number | string }[] = [];

  for (const path of CRON_JOBS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      });
      results.push({ path, status: res.status });
    } catch (err) {
      console.error(`Cron dispatcher: ${path} failed`, err);
      results.push({ path, status: 'error' });
    }
  }

  console.log('Cron dispatcher results:', results);
  return NextResponse.json({ results });
}
