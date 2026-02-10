import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch recent rejected feedback for an organization.
 */
export async function getRecentRejections(
  supabase: SupabaseClient,
  orgId: string,
  limit = 10
): Promise<Array<{ reason: string | null; tags: string[] }>> {
  const { data } = await supabase
    .from('content_feedback')
    .select('reason, tags')
    .eq('organization_id', orgId)
    .eq('feedback_type', 'rejected')
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Build a prompt section from recent rejection feedback.
 * Returns empty string if no rejections exist.
 */
export async function buildFeedbackPromptSection(
  supabase: SupabaseClient,
  orgId: string
): Promise<string> {
  const rejections = await getRecentRejections(supabase, orgId);
  if (rejections.length === 0) return '';

  const lines = rejections.map((r, i) => {
    const tagStr = r.tags && r.tags.length > 0 ? ` [${r.tags.join(', ')}]` : '';
    const reason = r.reason || 'No reason given';
    return `${i + 1}. "${reason}"${tagStr}`;
  });

  return `
CONTENT THE CLIENT HAS REJECTED (avoid these patterns):
${lines.join('\n')}
Learn from these rejections. Do NOT repeat the same mistakes.`;
}
