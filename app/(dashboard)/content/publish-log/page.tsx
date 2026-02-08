'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { SocialPlatform, PublishStatus } from '@/types/database';

interface PublishRecord {
  id: string;
  content_item_id: string;
  platform: SocialPlatform;
  platform_post_id: string | null;
  post_url: string | null;
  published_at: string | null;
  publish_status: PublishStatus;
  error_message: string | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  content_items: {
    topic: string | null;
    hook: string | null;
    caption: string | null;
    format: string;
    scheduled_date: string;
    scheduled_time: string | null;
  } | null;
}

type StatusTab = 'all' | PublishStatus;

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'publishing', label: 'Publishing' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'tiktok', label: 'TikTok' },
];

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700',
  facebook: 'bg-blue-50 text-blue-600',
  instagram: 'bg-pink-50 text-pink-600',
  twitter: 'bg-sky-50 text-sky-600',
  tiktok: 'bg-gray-100 text-gray-800',
};

const STATUS_CONFIG: Record<PublishStatus, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  queued: { icon: ClockIcon, color: 'bg-stone/10 text-stone', label: 'Queued' },
  publishing: { icon: SignalIcon, color: 'bg-amber-50 text-amber-700', label: 'Publishing' },
  published: { icon: CheckCircleIcon, color: 'bg-emerald-50 text-emerald-700', label: 'Published' },
  failed: { icon: ExclamationTriangleIcon, color: 'bg-red-50 text-red-700', label: 'Failed' },
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PublishLogPage() {
  const [records, setRecords] = useState<PublishRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (platformFilter !== 'all') params.set('platform', platformFilter);

    const res = await fetch(`/api/content/publish-log?${params.toString()}`);
    const data = await res.json();
    if (data.records) {
      setRecords(data.records);
    }
    setIsLoading(false);
  }, [statusFilter, platformFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleRetry = async (record: PublishRecord) => {
    setIsRetrying(record.id);
    try {
      await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItemId: record.content_item_id,
          platforms: [record.platform],
        }),
      });
      await loadRecords();
    } catch (error) {
      console.error('Retry failed:', error);
    }
    setIsRetrying(null);
  };

  const statusCounts = records.reduce((acc, r) => {
    acc[r.publish_status] = (acc[r.publish_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publish Log"
        subtitle="Monitor your social media publishing activity and troubleshoot errors"
      />

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-stone/10 pb-0">
        {STATUS_TABS.map(tab => {
          const count = tab.value === 'all' ? records.length : (statusCounts[tab.value] || 0);
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px]',
                statusFilter === tab.value
                  ? 'border-teal text-teal'
                  : 'border-transparent text-stone hover:text-charcoal'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-stone/10">
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-3">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone/20 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          >
            {PLATFORM_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={loadRecords}
            className="p-2 rounded-lg hover:bg-cream-warm transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4 text-stone" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-stone">Loading publish records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="w-10 h-10 text-stone/30 mx-auto mb-3" />
            <p className="text-stone">No publish records found</p>
            <p className="text-sm text-stone/60 mt-1">Published posts will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone/10 bg-cream-warm/50">
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Post</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Platform</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Scheduled</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Published</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Post URL</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Error</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Retries</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const statusInfo = STATUS_CONFIG[record.publish_status];
                  const StatusIcon = statusInfo.icon;
                  const contentItem = record.content_items;
                  const title = contentItem?.topic || contentItem?.caption?.slice(0, 50) || contentItem?.format?.replace(/_/g, ' ') || 'Untitled';
                  const scheduledDisplay = contentItem?.scheduled_date
                    ? `${contentItem.scheduled_date}${contentItem.scheduled_time ? ' ' + contentItem.scheduled_time : ''}`
                    : '—';

                  return (
                    <tr key={record.id} className="border-b border-stone/5 hover:bg-cream-warm/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal truncate max-w-[200px]" title={title}>
                          {title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded-md text-xs font-medium capitalize', PLATFORM_COLORS[record.platform] || 'bg-stone/10 text-stone')}>
                          {record.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', statusInfo.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone whitespace-nowrap">{scheduledDisplay}</td>
                      <td className="px-4 py-3 text-stone whitespace-nowrap">{formatDateTime(record.published_at)}</td>
                      <td className="px-4 py-3">
                        {record.post_url ? (
                          <a
                            href={record.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal hover:underline text-xs"
                          >
                            View <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-stone/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {record.error_message ? (
                          <span className="text-red-600 text-xs max-w-[200px] truncate block" title={record.error_message}>
                            {record.error_message}
                          </span>
                        ) : (
                          <span className="text-stone/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-stone">
                        {record.retry_count > 0 ? record.retry_count : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {record.publish_status === 'failed' && (
                          <button
                            onClick={() => handleRetry(record)}
                            disabled={isRetrying === record.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-teal bg-teal/10 hover:bg-teal/20 transition-colors disabled:opacity-50"
                          >
                            <ArrowPathIcon className={cn('w-3 h-3', isRetrying === record.id && 'animate-spin')} />
                            {isRetrying === record.id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                        {record.publish_status === 'published' && record.post_url && (
                          <a
                            href={record.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone bg-stone/5 hover:bg-stone/10 transition-colors"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
