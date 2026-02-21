import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron dispatcher for Vercel Hobby plan (max 2 crons, daily only).
 *
 * Supports two run modes via ?group= query param:
 *   - ?group=frequent  → only frequent jobs (social inbox, automations, publish, reminders)
 *   - ?group=daily     → only daily jobs (billing, analytics, sync, etc.)
 *   - (no group)       → all jobs
 *
 * Auth: Vercel Bearer token OR ?key= for external cron services (cron-job.org, etc.)
 *
 * External cron setup:
 *   - Daily (once/day):    https://your-app.vercel.app/api/cron?key=YOUR_CRON_SECRET&group=daily
 *   - Frequent (every 15m): https://your-app.vercel.app/api/cron?key=YOUR_CRON_SECRET&group=frequent
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Jobs that benefit from running multiple times per day
const FREQUENT_JOBS = [
  '/api/social/inbox/sync',
  '/api/automations/process',
  '/api/content/publish/scheduled',
  '/api/calls/reminders',
];

// Jobs that only need to run once per day
const DAILY_JOBS = [
  '/api/billing/credit-reset',
  '/api/content/analytics/sync',
  '/api/marketing/analytics/sync',
  '/api/bookings/sync',
  '/api/authority/notifications/process',
  '/api/authority/email/sync',
  '/api/content/generate/queue/process',
  '/api/calls/pre-call-briefs',
];

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Vercel cron sends Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  // External cron services use ?key= query param
  const keyParam = request.nextUrl.searchParams.get('key');
  if (keyParam === secret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const group = request.nextUrl.searchParams.get('group');

  let jobs: string[];
  if (group === 'frequent') {
    jobs = FREQUENT_JOBS;
  } else if (group === 'daily') {
    jobs = DAILY_JOBS;
  } else {
    jobs = [...DAILY_JOBS, ...FREQUENT_JOBS];
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const results: { path: string; status: number | string }[] = [];

  for (const path of jobs) {
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

  console.log(`Cron dispatcher [${group || 'all'}] results:`, results);
  return NextResponse.json({ group: group || 'all', results });
}
