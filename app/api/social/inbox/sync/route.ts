import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncConnectionInbox } from '@/lib/social/inbox-sync';
import type { ConnectionWithTokens } from '@/lib/social/token-manager';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  const keyParam = request.nextUrl.searchParams.get('key');
  if (keyParam === secret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get orgs with active social connections, ordered by oldest sync
  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('*, organizations!inner(id)')
    .eq('is_active', true)
    .order('inbox_last_synced_at', { ascending: true, nullsFirst: true })
    .limit(30); // Process max 30 connections per invocation

  if (!connections || connections.length === 0) {
    return NextResponse.json({ message: 'No connections to sync', synced: 0 });
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const connection of connections) {
    try {
      const result = await syncConnectionInbox(
        connection as unknown as ConnectionWithTokens,
        connection.organization_id
      );
      synced++;
      if (result.errors.length > 0) {
        errors.push(...result.errors.map(e => `[${connection.platform}] ${e}`));
      }
    } catch (err) {
      failed++;
      errors.push(`[${connection.platform}] ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  return NextResponse.json({
    message: 'Inbox sync complete',
    connectionsProcessed: connections.length,
    synced,
    failed,
    errors: errors.slice(0, 10), // Limit error output
  });
}
