import { createServiceClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';
import type { FeatureType, ChangeRequestStatus, Json } from '@/types/database';

interface CreateChangeRequestParams {
  orgId: string;
  userId: string;
  feature: FeatureType;
  entityType: string;
  entityId?: string;
  changeType: 'create' | 'update' | 'delete';
  currentValue?: unknown;
  proposedValue?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Create a change request for team member approval workflow.
 */
export async function createChangeRequest(params: CreateChangeRequestParams) {
  const supabase = createServiceClient();

  const { data: changeRequest, error } = await supabase
    .from('change_requests')
    .insert({
      organization_id: params.orgId,
      requested_by: params.userId,
      feature: params.feature,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      change_type: params.changeType,
      current_value: (params.currentValue ?? null) as Json,
      proposed_value: (params.proposedValue ?? null) as Json,
      metadata: (params.metadata || {}) as Json,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create change request:', error);
    throw new Error('Failed to create change request');
  }

  // Get requester name
  const { data: requester } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', params.userId)
    .single();

  // Notify org owner/admins
  const { data: admins } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', params.orgId)
    .in('role', ['owner', 'admin']);

  const featureLabel = params.feature.replace(/_/g, ' ');
  const requesterName = requester?.full_name || 'A team member';

  if (admins) {
    for (const admin of admins) {
      await createNotification({
        supabase,
        userId: admin.user_id,
        orgId: params.orgId,
        type: 'change_request_submitted',
        title: 'Change request submitted',
        body: `${requesterName} submitted a ${params.entityType.replace(/_/g, ' ')} change for review (${featureLabel}).`,
        link: '/reviews',
        metadata: { change_request_id: changeRequest.id },
      });
    }
  }

  return changeRequest;
}

/**
 * Review (approve/reject/request revision) a change request.
 */
export async function reviewChangeRequest(
  changeRequestId: string,
  reviewerUserId: string,
  action: 'approve' | 'reject' | 'request_revision',
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Get the change request
  const { data: cr } = await supabase
    .from('change_requests')
    .select('*')
    .eq('id', changeRequestId)
    .single();

  if (!cr) return { success: false, error: 'Change request not found' };
  if (cr.status !== 'pending' && cr.status !== 'revision_requested') {
    return { success: false, error: `Cannot review a ${cr.status} change request` };
  }

  // Verify reviewer is owner/admin
  const { data: reviewer } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', cr.organization_id)
    .eq('user_id', reviewerUserId)
    .single();

  if (!reviewer || !['owner', 'admin'].includes(reviewer.role)) {
    return { success: false, error: 'Only owners and admins can review change requests' };
  }

  const statusMap: Record<string, ChangeRequestStatus> = {
    approve: 'approved',
    reject: 'rejected',
    request_revision: 'revision_requested',
  };

  const newStatus = statusMap[action];

  // Update the change request
  await supabase
    .from('change_requests')
    .update({
      status: newStatus,
      reviewed_by: reviewerUserId,
      review_comment: comment || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', changeRequestId);

  // If approved, apply the change
  if (action === 'approve') {
    if (cr.entity_type === 'brand_variable') {
      await applyBrandVariableChange(cr);
    } else if (cr.entity_type === 'content_item') {
      await applyContentItemChange(cr);
    }
  }

  // Notify the requester
  const { data: reviewerUser } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', reviewerUserId)
    .single();

  const reviewerName = reviewerUser?.full_name || 'A reviewer';
  const entityLabel = cr.entity_type.replace(/_/g, ' ');

  const notifConfig: Record<string, { type: 'change_request_approved' | 'change_request_rejected' | 'change_request_revision'; title: string; body: string }> = {
    approve: {
      type: 'change_request_approved',
      title: 'Change approved',
      body: `${reviewerName} approved your ${entityLabel} change.${comment ? ` Comment: ${comment}` : ''}`,
    },
    reject: {
      type: 'change_request_rejected',
      title: 'Change rejected',
      body: `${reviewerName} rejected your ${entityLabel} change.${comment ? ` Reason: ${comment}` : ''}`,
    },
    request_revision: {
      type: 'change_request_revision',
      title: 'Revision requested',
      body: `${reviewerName} requested changes to your ${entityLabel}.${comment ? ` Feedback: ${comment}` : ''}`,
    },
  };

  const notif = notifConfig[action];
  await createNotification({
    supabase,
    userId: cr.requested_by,
    orgId: cr.organization_id,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    link: '/reviews',
    metadata: { change_request_id: changeRequestId },
  });

  return { success: true };
}

/**
 * Apply an approved brand variable change to brand_outputs.
 */
async function applyBrandVariableChange(cr: Record<string, unknown>) {
  const supabase = createServiceClient();
  const proposed = cr.proposed_value as Record<string, unknown> | null;
  const metadata = (cr.metadata || {}) as Record<string, unknown>;

  if (!proposed || !cr.entity_id) return;

  await supabase
    .from('brand_outputs')
    .upsert(
      {
        organization_id: cr.organization_id as string,
        phase_id: (metadata.phase_id as string) || '',
        output_key: cr.entity_id as string,
        output_value: proposed.value as string,
        is_locked: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,output_key' }
    );
}

/**
 * Apply an approved content item change.
 */
async function applyContentItemChange(cr: Record<string, unknown>) {
  const supabase = createServiceClient();
  const proposed = cr.proposed_value as Record<string, unknown> | null;

  if (!proposed || !cr.entity_id) return;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Copy allowed fields from proposed value
  const allowedFields = ['topic', 'script', 'post_description', 'format', 'platform', 'funnel_stage', 'storybrand_stage', 'target_url'];
  for (const field of allowedFields) {
    if (field in proposed) {
      updateData[field] = proposed[field];
    }
  }

  await supabase
    .from('content_items')
    .update(updateData)
    .eq('id', cr.entity_id as string);
}

/**
 * Get pending change requests for an org with optional filters.
 */
export async function getPendingChangeRequests(
  orgId: string,
  filters?: { feature?: string; status?: string; requestedBy?: string }
) {
  const supabase = createServiceClient();
  let query = supabase
    .from('change_requests')
    .select('*, requester:requested_by(full_name, email), reviewer:reviewed_by(full_name), assignee:assigned_to(full_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.feature) {
    query = query.eq('feature', filters.feature);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.requestedBy) {
    query = query.eq('requested_by', filters.requestedBy);
  }

  const { data } = await query;
  return data || [];
}

/**
 * Check if there are pending change requests for specific brand variable(s).
 */
export async function hasPendingChangeRequests(
  orgId: string,
  entityType: string,
  entityIds: string[]
): Promise<boolean> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('entity_type', entityType)
    .in('entity_id', entityIds)
    .in('status', ['pending', 'revision_requested']);

  return (count || 0) > 0;
}
