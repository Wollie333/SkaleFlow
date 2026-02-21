import { createServiceClient } from '@/lib/supabase/server';
import type { TeamActivityAction, Json } from '@/types/database';

export async function logTeamActivity(
  orgId: string,
  actorId: string,
  action: TeamActivityAction,
  targetUserId?: string | null,
  metadata?: Record<string, unknown>
) {
  const serviceClient = createServiceClient();

  const targetEmail = metadata?.email as string | undefined;

  const { error } = await serviceClient.from('team_activity_log').insert({
    organization_id: orgId,
    actor_id: actorId,
    action,
    target_user_id: targetUserId || null,
    target_email: targetEmail || null,
    metadata: (metadata || {}) as unknown as Json,
  });

  if (error) {
    console.error('Failed to log team activity:', error);
  }
}
