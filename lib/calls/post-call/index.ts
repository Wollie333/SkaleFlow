/**
 * Post-call processing pipeline.
 * Triggered when a call ends — generates summary, action items, follow-up, scores, insights.
 */

import { generateCallSummary } from './summary';
import { extractActionItems } from './action-items';
import { draftFollowUpEmail } from './follow-up';
import { recommendDealStage } from './deal-recommendation';
import { scoreCall } from './scoring';
import { extractBrandInsights } from './insights';
import { generateStrategicInsights } from './strategic-insights';
import { createServiceClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

export async function runPostCallPipeline(callId: string, orgId: string, hostUserId: string): Promise<void> {
  console.log(`[PostCall] Starting pipeline for call ${callId}`);
  const supabase = createServiceClient();

  try {
    // 1. Generate summary
    const summary = await generateCallSummary(callId, orgId, hostUserId);
    if (!summary) {
      console.error('[PostCall] Summary generation failed');
      return;
    }

    // 2-7 can run in parallel
    const results = await Promise.allSettled([
      extractActionItems(callId, summary.id, orgId, hostUserId),
      draftFollowUpEmail(callId, orgId, hostUserId),
      recommendDealStage(callId, orgId, hostUserId),
      scoreCall(callId, orgId, hostUserId),
      extractBrandInsights(callId, orgId, hostUserId),
      generateStrategicInsights(callId, orgId, hostUserId),
    ]);

    // Log any failures
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const steps = ['action-items', 'follow-up', 'deal-recommendation', 'scoring', 'insights', 'strategic-insights'];
        console.error(`[PostCall] ${steps[i]} failed:`, r.reason);
      }
    });

    // Update call status
    await supabase
      .from('calls')
      .update({ call_status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', callId);

    // Notify host
    await createNotification({
      supabase,
      userId: hostUserId,
      orgId,
      type: 'call_summary_ready',
      title: 'Call summary ready',
      body: 'Your post-call summary, action items, and insights are ready for review.',
      link: `/calls/${callId}/summary`,
      metadata: { call_id: callId },
    });

    // Log CRM activity
    const { data: call } = await supabase
      .from('calls')
      .select('crm_contact_id, title, actual_start, actual_end, room_code')
      .eq('id', callId)
      .single();

    if (call?.crm_contact_id) {
      await supabase.from('crm_activity').insert({
        organization_id: orgId,
        contact_id: call.crm_contact_id,
        activity_type: 'call',
        title: call.title,
        description: summary.summary_text || 'Call completed',
        metadata: {
          call_id: callId,
          room_code: call.room_code,
          duration_min: call.actual_start && call.actual_end
            ? Math.round((new Date(call.actual_end).getTime() - new Date(call.actual_start).getTime()) / 60000)
            : null,
          summary_id: summary.id,
        },
        performed_by: hostUserId,
      });
    }

    // Brand Audit extraction: if call is linked to a brand_audit, extract data
    try {
      const { data: linkedAudit } = await supabase
        .from('brand_audits')
        .select('id, status')
        .eq('call_id', callId)
        .single();

      if (linkedAudit && ['draft', 'call_scheduled', 'call_in_progress'].includes(linkedAudit.status)) {
        console.log(`[PostCall] Running brand audit extraction for audit ${linkedAudit.id}`);
        const { extractBrandAuditData } = await import('@/lib/brand-audit/call-extraction');
        await extractBrandAuditData(callId, orgId, hostUserId);
      }
    } catch (auditError) {
      // Non-fatal — brand audit extraction is optional
      console.error('[PostCall] Brand audit extraction failed:', auditError);
    }

    console.log(`[PostCall] Pipeline complete for call ${callId}`);
  } catch (error) {
    console.error('[PostCall] Pipeline error:', error);
  }
}
