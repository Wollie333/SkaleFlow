'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';

interface PublishedPost {
  id: string;
  platform: SocialPlatform;
  publish_status: 'queued' | 'publishing' | 'published' | 'failed';
  post_url: string | null;
  error_message: string | null;
  retry_count: number;
  published_at: string | null;
  connection_id: string;
}

interface PublishStatusPanelProps {
  contentItemId: string;
  posts: PublishedPost[];
  onRetry?: (connectionId: string) => void;
  isRetrying?: boolean;
}

const STATUS_CONFIG = {
  published: {
    icon: CheckCircleIcon,
    label: 'Published',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  failed: {
    icon: XCircleIcon,
    label: 'Failed',
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  publishing: {
    icon: ArrowPathIcon,
    label: 'Publishing...',
    color: 'text-teal',
    bg: 'bg-teal/5',
    border: 'border-teal/20',
  },
  queued: {
    icon: ClockIcon,
    label: 'Queued',
    color: 'text-stone',
    bg: 'bg-stone/5',
    border: 'border-stone/20',
  },
};

export function PublishStatusPanel({ contentItemId, posts, onRetry, isRetrying }: PublishStatusPanelProps) {
  if (!posts || posts.length === 0) return null;

  const successCount = posts.filter(p => p.publish_status === 'published').length;
  const failedCount = posts.filter(p => p.publish_status === 'failed').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SignalIcon className="w-5 h-5 text-teal" />
          <h4 className="text-sm font-semibold text-charcoal">Publish Status</h4>
        </div>
        <div className="flex gap-2">
          {successCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
              {successCount} published
            </span>
          )}
          {failedCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
              {failedCount} failed
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {posts.map(post => {
          const config = STATUS_CONFIG[post.publish_status];
          const platformConfig = PLATFORM_CONFIG[post.platform];
          const StatusIcon = config.icon;

          return (
            <div
              key={post.id}
              className={cn(
                'rounded-lg border p-3 transition-all',
                config.bg,
                config.border
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: platformConfig?.color || '#6B7280' }}
                  >
                    {(platformConfig?.name || post.platform).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {platformConfig?.name || post.platform}
                    </p>
                    <div className="flex items-center gap-1">
                      <StatusIcon className={cn('w-3.5 h-3.5', config.color, post.publish_status === 'publishing' && 'animate-spin')} />
                      <span className={cn('text-xs', config.color)}>{config.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {post.publish_status === 'published' && post.post_url && (
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal hover:text-teal-dark bg-teal/5 hover:bg-teal/10 rounded-md transition-colors"
                    >
                      View Post
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </a>
                  )}
                  {post.publish_status === 'failed' && onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(post.connection_id)}
                      isLoading={isRetrying}
                      className="text-xs"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>

              {post.publish_status === 'failed' && post.error_message && (
                <div className="mt-2 px-2 py-1.5 bg-red-100/50 rounded text-xs text-red-600">
                  {post.error_message}
                </div>
              )}

              {post.publish_status === 'published' && post.published_at && (
                <p className="mt-1 text-xs text-stone">
                  Published {new Date(post.published_at).toLocaleString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
