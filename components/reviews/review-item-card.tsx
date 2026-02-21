'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { ChevronDownIcon, ClockIcon, UserCircleIcon, FlagIcon } from '@heroicons/react/24/outline';
import { BrandChangeDiff } from './brand-change-diff';
import { ReviewActions } from './review-actions';
import { ReviewCommentThread } from './review-comment-thread';

export interface ChangeRequestItem {
  id: string;
  requested_by: string;
  feature: string;
  entity_type: string;
  entity_id: string | null;
  change_type: string;
  current_value: unknown;
  proposed_value: unknown;
  metadata: Record<string, unknown>;
  status: string;
  review_comment: string | null;
  assigned_to: string | null;
  priority: string;
  deadline: string | null;
  created_at: string;
  requester?: { full_name: string; email: string };
  reviewer?: { full_name: string };
  assignee?: { full_name: string; email: string } | null;
}

interface OrgAdmin {
  user_id: string;
  full_name: string | null;
  email: string;
}

export interface ReviewItemCardProps {
  item: ChangeRequestItem;
  onReview: (id: string, action: string, comment?: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  orgAdmins?: OrgAdmin[];
  onAssign?: (id: string, userId: string | null) => void;
  onSetPriority?: (id: string, priority: string) => void;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function getFeatureBadgeVariant(
  feature: string
): 'primary' | 'warning' | 'success' | 'default' {
  switch (feature) {
    case 'brand_engine':
      return 'primary';
    case 'content_engine':
      return 'warning';
    case 'pipeline':
      return 'success';
    default:
      return 'default';
  }
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-500/10 text-green-400',
    rejected: 'bg-red-500/10 text-red-400',
    revision_requested: 'bg-amber-100 text-amber-800',
  };

  return (
    <span
      className={cn(
        'text-xs font-semibold px-2.5 py-1 rounded-full capitalize',
        styles[status] || 'bg-stone/10 text-stone'
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-stone/10 text-stone',
  low: 'bg-stone/5 text-stone/60',
};

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'normal') return null;
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase', PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal)}>
      {priority}
    </span>
  );
}

function getEntityDescription(item: ChangeRequestItem): string {
  const entityType = item.entity_type.replace(/_/g, ' ');
  const changeType = item.change_type;

  if (item.entity_id && item.metadata?.output_label) {
    return `${changeType} ${String(item.metadata.output_label)}`;
  }

  if (item.entity_id) {
    return `${changeType} ${entityType} (${item.entity_id.slice(0, 8)}...)`;
  }

  return `${changeType} ${entityType}`;
}

function getInitial(name?: string, email?: string): string {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return '?';
}

export function ReviewItemCard({
  item,
  onReview,
  isExpanded,
  onToggleExpand,
  orgAdmins,
  onAssign,
  onSetPriority,
}: ReviewItemCardProps) {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  const isPending =
    item.status === 'pending' || item.status === 'revision_requested';

  const handleReview = useCallback(
    async (action: string) => {
      setIsLoading(true);
      try {
        await onReview(item.id, action, comment || undefined);
        setComment('');
      } finally {
        setIsLoading(false);
      }
    },
    [item.id, comment, onReview]
  );

  const requesterName =
    item.requester?.full_name || item.requester?.email || 'Unknown';
  const initial = getInitial(
    item.requester?.full_name,
    item.requester?.email
  );

  return (
    <div
      className={cn(
        'bg-cream-warm rounded-xl border shadow-[0_2px_12px_rgba(15,31,29,0.03)] transition-all duration-200',
        isExpanded
          ? 'border-teal/20 ring-1 ring-teal/10'
          : 'border-teal/[0.08] hover:border-teal/15'
      )}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-5 py-4 flex items-center gap-4 text-left"
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal/10 text-teal flex items-center justify-center text-sm font-bold">
          {initial}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-charcoal truncate">
              {requesterName}
            </span>
            <Badge
              variant={getFeatureBadgeVariant(item.feature)}
              size="sm"
            >
              {item.feature.replace(/_/g, ' ')}
            </Badge>
            <PriorityBadge priority={item.priority || 'normal'} />
          </div>
          <p className="text-sm text-stone mt-0.5 truncate">
            {getEntityDescription(item)}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Assignee indicator */}
          {item.assignee && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-stone" title={`Assigned to ${item.assignee.full_name || item.assignee.email}`}>
              <UserCircleIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[60px]">{item.assignee.full_name || item.assignee.email}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-stone">
            <ClockIcon className="w-3.5 h-3.5" />
            {getRelativeTime(item.created_at)}
          </div>
          {getStatusBadge(item.status)}
          <ChevronDownIcon
            className={cn(
              'w-4 h-4 text-stone transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-stone/8">
          <div className="pt-4 space-y-4">
            {/* Assignment & Priority controls (for pending items) */}
            {isPending && (onAssign || onSetPriority) && (
              <div className="flex items-center gap-3 flex-wrap">
                {/* Assign dropdown */}
                {onAssign && orgAdmins && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setAssignDropdownOpen(!assignDropdownOpen); setPriorityDropdownOpen(false); }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-stone border border-stone/15 rounded-lg px-2.5 py-1.5 hover:bg-stone/5 transition-colors"
                    >
                      <UserCircleIcon className="w-3.5 h-3.5" />
                      {item.assignee ? (item.assignee.full_name || item.assignee.email) : 'Assign'}
                      <ChevronDownIcon className="w-3 h-3" />
                    </button>
                    {assignDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setAssignDropdownOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 z-50 bg-cream-warm rounded-lg border border-stone/10 shadow-lg py-1 min-w-[180px]">
                          <button
                            type="button"
                            onClick={() => { onAssign(item.id, null); setAssignDropdownOpen(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs text-stone hover:bg-cream transition-colors"
                          >
                            Unassign
                          </button>
                          {orgAdmins.map(admin => (
                            <button
                              key={admin.user_id}
                              type="button"
                              onClick={() => { onAssign(item.id, admin.user_id); setAssignDropdownOpen(false); }}
                              className={cn(
                                'w-full text-left px-3 py-1.5 text-xs transition-colors',
                                item.assigned_to === admin.user_id ? 'bg-teal/5 text-teal font-medium' : 'text-charcoal hover:bg-cream'
                              )}
                            >
                              {admin.full_name || admin.email}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Priority dropdown */}
                {onSetPriority && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setPriorityDropdownOpen(!priorityDropdownOpen); setAssignDropdownOpen(false); }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-stone border border-stone/15 rounded-lg px-2.5 py-1.5 hover:bg-stone/5 transition-colors"
                    >
                      <FlagIcon className="w-3.5 h-3.5" />
                      Priority: {item.priority || 'normal'}
                      <ChevronDownIcon className="w-3 h-3" />
                    </button>
                    {priorityDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setPriorityDropdownOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 z-50 bg-cream-warm rounded-lg border border-stone/10 shadow-lg py-1 min-w-[120px]">
                          {['urgent', 'normal', 'low'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => { onSetPriority(item.id, p); setPriorityDropdownOpen(false); }}
                              className={cn(
                                'w-full text-left px-3 py-1.5 text-xs capitalize transition-colors',
                                (item.priority || 'normal') === p ? 'bg-teal/5 text-teal font-medium' : 'text-charcoal hover:bg-cream'
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Review comment if resolved */}
            {item.review_comment && !isPending && (
              <div className="rounded-lg bg-stone/5 p-3">
                <p className="text-xs font-semibold text-stone mb-1">
                  Review Comment
                  {item.reviewer?.full_name && (
                    <span className="font-normal">
                      {' '}
                      by {item.reviewer.full_name}
                    </span>
                  )}
                </p>
                <p className="text-sm text-charcoal">{item.review_comment}</p>
              </div>
            )}

            {/* Diff view */}
            {item.entity_type === 'brand_variable' ? (
              <BrandChangeDiff
                currentValue={item.current_value}
                proposedValue={item.proposed_value}
                outputKey={item.entity_id || item.entity_type}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
                  <p className="text-xs font-semibold text-red-600 mb-2">
                    Current
                  </p>
                  <pre className="text-sm text-red-400 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-60 overflow-auto">
                    {item.current_value
                      ? typeof item.current_value === 'string'
                        ? item.current_value
                        : JSON.stringify(item.current_value, null, 2)
                      : '(empty)'}
                  </pre>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50/60 p-4">
                  <p className="text-xs font-semibold text-green-400 mb-2">
                    Proposed
                  </p>
                  <pre className="text-sm text-green-400 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-60 overflow-auto">
                    {item.proposed_value
                      ? typeof item.proposed_value === 'string'
                        ? item.proposed_value
                        : JSON.stringify(item.proposed_value, null, 2)
                      : '(empty)'}
                  </pre>
                </div>
              </div>
            )}

            {/* Comment thread */}
            <ReviewCommentThread changeRequestId={item.id} />

            {/* Action buttons for pending items */}
            {isPending && (
              <ReviewActions
                onApprove={() => handleReview('approve')}
                onRequestRevision={() => handleReview('request_revision')}
                onReject={() => handleReview('reject')}
                comment={comment}
                onCommentChange={setComment}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
