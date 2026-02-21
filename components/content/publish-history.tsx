'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import {
  PlusCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/lib/social/types';

interface TimelineEvent {
  type: string;
  timestamp: string;
  description: string;
  details?: Record<string, unknown>;
}

interface PublishHistoryProps {
  contentItemId: string;
}

const EVENT_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}> = {
  created: { icon: PlusCircleIcon, color: 'text-stone', bg: 'bg-stone/10' },
  scheduled: { icon: CalendarIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  content_submitted: { icon: ClockIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
  content_approved: { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  content_rejected: { icon: XCircleIcon, color: 'text-red-500', bg: 'bg-red-50' },
  revision_requested: { icon: ArrowPathIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
  published: { icon: PaperAirplaneIcon, color: 'text-teal', bg: 'bg-teal/10' },
  failed: { icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-50' },
  publish_failed: { icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-50' },
};

const DEFAULT_CONFIG = { icon: ChatBubbleLeftIcon, color: 'text-stone', bg: 'bg-stone/10' };

export function PublishHistory({ contentItemId }: PublishHistoryProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/content/items/${contentItemId}/history`);
        if (res.ok) {
          const json = await res.json();
          setTimeline(json.timeline || []);
        }
      } catch {
        // Non-critical
      }
      setLoading(false);
    }
    if (contentItemId) load();
  }, [contentItemId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <button
          className="flex items-center gap-2 text-sm font-medium text-stone hover:text-charcoal transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <ClockIcon className="w-4 h-4" />
          History
        </button>
      </div>
    );
  }

  if (timeline.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        className="flex items-center gap-2 text-sm font-medium text-stone hover:text-charcoal transition-colors w-full"
        onClick={() => setExpanded(!expanded)}
      >
        <ClockIcon className="w-4 h-4" />
        History
        <span className="text-xs text-stone/60 ml-auto">{timeline.length} events</span>
      </button>

      {expanded && (
        <div className="relative pl-6 space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-stone/15" />

          {timeline.map((event, idx) => {
            const config = EVENT_CONFIG[event.type] || DEFAULT_CONFIG;
            const Icon = config.icon;
            const platform = event.details?.platform as string | undefined;
            const platformConf = platform ? PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG] : null;

            return (
              <div key={idx} className="relative flex gap-3 py-2">
                {/* Dot */}
                <div className={cn(
                  'absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 border-2 border-cream-warm',
                  config.bg
                )}>
                  <Icon className={cn('w-3 h-3', config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-charcoal font-medium truncate">{event.description}</p>
                    {platformConf && (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: platformConf.color }}
                      >
                        {platformConf.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone mt-0.5">
                    {new Date(event.timestamp).toLocaleString('en-ZA', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {event.details?.error && (
                    <p className="text-xs text-red-500 mt-1">{String(event.details.error)}</p>
                  )}
                  {event.details?.postUrl && (
                    <a
                      href={String(event.details.postUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal hover:underline mt-1 inline-block"
                    >
                      View post →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
