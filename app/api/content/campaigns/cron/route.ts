import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { detectWinners } from '@/lib/content-engine/winner-detector';
import { analyzeAndRecommend } from '@/lib/content-engine/adjustment-engine';
import { processV3QueueCron } from '@/lib/content-engine/v3-queue-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * V3 Content Engine Cron Job
 * Runs daily:
 * 1. Winner detection — scans published posts for winners
 * 2. Adjustment engine — analyzes active campaigns for recommendations
 * 3. Queue processing — picks up any stale/abandoned generation batches
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel cron)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const results = {
      winners: 0,
      adjustments: 0,
      queueProcessed: 0,
      errors: [] as string[],
    };

    // 1. Get all orgs with active campaigns
    const { data: orgs } = await supabase
      .from('campaigns')
      .select('organization_id')
      .eq('status', 'active');

    const orgIds = Array.from(new Set((orgs || []).map(o => o.organization_id)));

    // 2. Winner detection — per org
    for (const orgId of orgIds) {
      try {
        const winners = await detectWinners(supabase, orgId);
        results.winners += winners.length;
      } catch (err: any) {
        results.errors.push(`Winner detection error for org ${orgId}: ${err.message}`);
      }
    }

    // 3. Adjustment engine — per active campaign
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('status', 'active');

    for (const campaign of (activeCampaigns || [])) {
      try {
        const adjustments = await analyzeAndRecommend(supabase, campaign.id);
        results.adjustments += adjustments.length;
      } catch (err: any) {
        results.errors.push(`Adjustment error for campaign ${campaign.id}: ${err.message}`);
      }
    }

    // 4. Process stale queue items (safety net)
    try {
      const queueResult = await processV3QueueCron(supabase);
      results.queueProcessed = queueResult.processed;
    } catch (err: any) {
      results.errors.push(`Queue processing error: ${err.message}`);
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
