'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button, StatusBadge } from '@/components/ui';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { ContentStatus, FunnelStage, StoryBrandStage, TimeSlot } from '@/types/database';

interface QueueItem {
  id: string;
  scheduled_date: string;
  time_slot: TimeSlot;
  funnel_stage: FunnelStage;
  storybrand_stage: StoryBrandStage;
  format: string;
  topic: string | null;
  hook: string | null;
  status: ContentStatus;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ApprovalQueueProps<T extends QueueItem = QueueItem> {
  items: T[];
  onApprove: (itemId: string, comment?: string) => Promise<void>;
  onReject: (itemId: string, comment: string) => Promise<void>;
  onRequestRevision?: (itemId: string, comment: string) => Promise<void>;
  onItemClick: (item: T) => void;
}

export function ApprovalQueue<T extends QueueItem>({ items, onApprove, onReject, onRequestRevision, onItemClick }: ApprovalQueueProps<T>) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedAction, setExpandedAction] = useState<'reject' | 'revision' | null>(null);
  const [commentText, setCommentText] = useState('');

  if (items.length === 0) return null;

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    await onApprove(id);
    setLoadingId(null);
  };

  const handleReject = async (id: string) => {
    if (!commentText.trim()) return;
    setLoadingId(id);
    await onReject(id, commentText);
    setLoadingId(null);
    setExpandedId(null);
    setExpandedAction(null);
    setCommentText('');
  };

  const handleRequestRevision = async (id: string) => {
    if (!commentText.trim() || !onRequestRevision) return;
    setLoadingId(id);
    await onRequestRevision(id, commentText);
    setLoadingId(null);
    setExpandedId(null);
    setExpandedAction(null);
    setCommentText('');
  };

  const toggleExpand = (id: string, action: 'reject' | 'revision') => {
    if (expandedId === id && expandedAction === action) {
      setExpandedId(null);
      setExpandedAction(null);
      setCommentText('');
    } else {
      setExpandedId(id);
      setExpandedAction(action);
      setCommentText('');
    }
  };

  const pendingItems = items.filter(i => i.status === 'pending_review');
  const revisionItems = items.filter(i => i.status === 'revision_requested');

  return (
    <div className="bg-cream-warm rounded-xl border border-amber-200 overflow-hidden">
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-amber-800">
          Needs Attention ({items.length})
        </h3>
      </div>
      <div className="divide-y divide-stone/5">
        {pendingItems.length > 0 && pendingItems.map(item => (
          <div key={item.id} className="p-4 hover:bg-cream/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onItemClick(item)} className="flex-1 text-left">
                <p className="text-sm font-medium text-charcoal truncate">
                  {item.topic || item.format.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-stone mt-0.5">
                  {format(new Date(item.scheduled_date), 'MMM d')} • {item.time_slot} • {item.funnel_stage}
                </p>
                {item.hook && (
                  <p className="text-xs text-stone mt-1 truncate italic">&quot;{item.hook}&quot;</p>
                )}
              </button>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleApprove(item.id)}
                  disabled={loadingId === item.id}
                  className="text-green-600 hover:bg-green-50"
                  title="Approve"
                >
                  <CheckIcon className="w-4 h-4" />
                </Button>
                {onRequestRevision && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpand(item.id, 'revision')}
                    disabled={loadingId === item.id}
                    className="text-amber-600 hover:bg-amber-50"
                    title="Request Revisions"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleExpand(item.id, 'reject')}
                  disabled={loadingId === item.id}
                  className="text-red-600 hover:bg-red-50"
                  title="Reject"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {expandedId === item.id && expandedAction && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={expandedAction === 'revision' ? 'What changes are needed...' : 'Reason for rejection...'}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
                />
                <Button
                  size="sm"
                  onClick={() => expandedAction === 'revision' ? handleRequestRevision(item.id) : handleReject(item.id)}
                  disabled={!commentText.trim()}
                  className={expandedAction === 'revision' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                >
                  {expandedAction === 'revision' ? 'Request Revision' : 'Reject'}
                </Button>
              </div>
            )}
          </div>
        ))}
        {revisionItems.length > 0 && (
          <>
            {pendingItems.length > 0 && (
              <div className="px-4 py-2 bg-amber-50/50">
                <p className="text-xs font-medium text-amber-700">Awaiting Revisions</p>
              </div>
            )}
            {revisionItems.map(item => (
              <div key={item.id} className="p-4 hover:bg-cream/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => onItemClick(item)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {item.topic || item.format.replace(/_/g, ' ')}
                      </p>
                      <StatusBadge status="revision_requested" />
                    </div>
                    <p className="text-xs text-stone mt-0.5">
                      {format(new Date(item.scheduled_date), 'MMM d')} • {item.time_slot}
                    </p>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
