'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import {
  ClockIcon,
  ArrowUturnLeftIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Revision {
  id: string;
  post_id: string;
  user_id: string;
  revision_number: number;
  snapshot: Record<string, unknown>;
  changed_fields: string[] | null;
  change_summary: string | null;
  action_type: string;
  triggered_by: string | null;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

interface RevisionHistoryPanelProps {
  postId: string;
  currentUserId: string;
  canRevert?: boolean;
  onReverted?: () => void;
  className?: string;
}

export function RevisionHistoryPanel({
  postId,
  currentUserId,
  canRevert = false,
  onReverted,
  className,
}: RevisionHistoryPanelProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [expandedRevisionId, setExpandedRevisionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);
  const toast = useToast();

  const fetchRevisions = useCallback(async () => {
    try {
      const res = await fetch(`/api/content/posts/${postId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const handleRevert = async (revisionId: string, revisionNumber: number) => {
    if (!confirm(`Are you sure you want to revert to revision #${revisionNumber}? This will create a new revision with the previous content.`)) {
      return;
    }

    setReverting(revisionId);
    try {
      const res = await fetch(`/api/content/posts/${postId}/revisions/${revisionId}/revert`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success(`Reverted to revision #${revisionNumber}`);
        await fetchRevisions();
        onReverted?.();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to revert');
      }
    } catch (error) {
      toast.error('Failed to revert');
    } finally {
      setReverting(null);
    }
  };

  const toggleExpanded = (revisionId: string) => {
    setExpandedRevisionId(expandedRevisionId === revisionId ? null : revisionId);
  };

  const formatRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const actionTypeLabels: Record<string, string> = {
    created: 'Created',
    edited: 'Edited',
    status_changed: 'Status Changed',
    media_changed: 'Media Changed',
    schedule_changed: 'Schedule Changed',
    reverted: 'Reverted',
  };

  const triggeredByLabels: Record<string, string> = {
    user: 'Manual Edit',
    ai_regeneration: 'AI Regeneration',
    bulk_edit: 'Bulk Edit',
    approval_workflow: 'Approval Workflow',
    revert_to_revision: 'Reverted',
  };

  const fieldLabels: Record<string, string> = {
    hook: 'Hook',
    body: 'Body',
    cta: 'Call to Action',
    caption: 'Caption',
    hashtags: 'Hashtags',
    visual_brief: 'Visual Brief',
    shot_suggestions: 'Shot Suggestions',
    slide_content: 'Slide Content',
    on_screen_text: 'On-Screen Text',
    video_script: 'Video Script',
    topic: 'Topic',
    content_type: 'Content Type',
    format: 'Format',
    placement_type: 'Placement Type',
    scheduled_date: 'Scheduled Date',
    scheduled_time: 'Scheduled Time',
    status: 'Status',
    assigned_to: 'Assigned To',
    target_url: 'Target URL',
    utm_parameters: 'UTM Parameters',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-teal" />
          <h3 className="font-serif text-lg font-bold text-charcoal">
            Revision History {revisions.length > 0 && `(${revisions.length})`}
          </h3>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-stone/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone/10 rounded w-1/4" />
                <div className="h-3 bg-stone/8 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revisions list */}
      {!isLoading && revisions.length === 0 && (
        <div className="text-center py-8 text-sm text-stone">
          No revisions recorded yet.
        </div>
      )}

      {!isLoading && revisions.length > 0 && (
        <div className="space-y-3">
          {revisions.map((revision, index) => {
            const isExpanded = expandedRevisionId === revision.id;
            const isLatest = index === 0;

            return (
              <div
                key={revision.id}
                className={cn(
                  'bg-cream-warm rounded-lg border overflow-hidden transition-colors',
                  isLatest ? 'border-teal/20 bg-teal/5' : 'border-stone/10'
                )}
              >
                {/* Revision header */}
                <button
                  onClick={() => toggleExpanded(revision.id)}
                  className="w-full p-4 flex items-start gap-3 hover:bg-stone/5 transition-colors text-left"
                >
                  {/* Avatar */}
                  {revision.user?.avatar_url ? (
                    <img
                      src={revision.user.avatar_url}
                      alt={revision.user.full_name}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-teal" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-charcoal">
                        Revision #{revision.revision_number}
                      </p>
                      {isLatest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal text-white">
                          Current
                        </span>
                      )}
                      <span className="text-xs text-stone">
                        {formatRelativeTime(revision.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-stone">
                        {revision.user?.full_name || 'Unknown User'}
                      </p>
                      <span className="text-xs text-stone">•</span>
                      <span className="text-xs text-stone">
                        {actionTypeLabels[revision.action_type] || revision.action_type}
                      </span>
                      {revision.triggered_by && (
                        <>
                          <span className="text-xs text-stone">•</span>
                          <span className="text-xs text-stone">
                            {triggeredByLabels[revision.triggered_by] || revision.triggered_by}
                          </span>
                        </>
                      )}
                    </div>

                    {revision.change_summary && (
                      <p className="text-xs text-stone mt-1">{revision.change_summary}</p>
                    )}
                  </div>

                  {/* Expand icon */}
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-stone flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-stone flex-shrink-0" />
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-stone/10 bg-white/50">
                    {/* Changed fields */}
                    {revision.changed_fields && revision.changed_fields.length > 0 && (
                      <div className="pt-3">
                        <p className="text-xs font-medium text-stone uppercase tracking-wider mb-2">
                          Changed Fields
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {revision.changed_fields.map(field => (
                            <span
                              key={field}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700"
                            >
                              {fieldLabels[field] || field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Revert button */}
                    {canRevert && !isLatest && (
                      <div className="pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevert(revision.id, revision.revision_number);
                          }}
                          disabled={reverting === revision.id}
                          isLoading={reverting === revision.id}
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4" />
                          Revert to this version
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
