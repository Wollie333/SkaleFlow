'use client';

import { useState } from 'react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export interface TopPost {
  id: string;
  contentItemId: string;
  platform: SocialPlatform;
  topic: string | null;
  hook: string | null;
  publishedAt: string;
  postUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  clicks: number;
  videoViews: number;
  engagementRate: number;
}

interface TopPostsTableProps {
  posts: TopPost[];
  isLoading?: boolean;
  visibleColumns?: SortKey[];
  onPostClick?: (post: TopPost) => void;
}

export type SortKey = 'likes' | 'comments' | 'shares' | 'saves' | 'impressions' | 'reach' | 'clicks' | 'videoViews' | 'engagementRate';

const ALL_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
  { key: 'saves', label: 'Saves' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'reach', label: 'Reach' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'videoViews', label: 'Video Views' },
  { key: 'engagementRate', label: 'Eng. Rate' },
];

export function TopPostsTable({ posts, isLoading, visibleColumns, onPostClick }: TopPostsTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('engagementRate');
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const diff = (a[sortBy] || 0) - (b[sortBy] || 0);
    return sortDesc ? -diff : diff;
  });

  const columns = visibleColumns
    ? ALL_COLUMNS.filter(col => visibleColumns.includes(col.key))
    : ALL_COLUMNS;

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Top Performing Posts</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-stone/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Top Performing Posts</h3>
        <p className="text-stone text-center py-8">No published posts with analytics data yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-heading-md text-charcoal mb-4">Top Performing Posts</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone/10">
              <th className="text-left text-xs font-semibold text-stone uppercase tracking-wider pb-3 pr-4">Post</th>
              <th className="text-left text-xs font-semibold text-stone uppercase tracking-wider pb-3 pr-4">Platform</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-right text-xs font-semibold text-stone uppercase tracking-wider pb-3 pr-4 cursor-pointer hover:text-charcoal"
                >
                  {col.label}
                  {sortBy === col.key && (
                    <span className="ml-1">{sortDesc ? '\u2193' : '\u2191'}</span>
                  )}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map(post => (
              <tr
                key={post.id}
                className={cn(
                  'border-b border-stone/5 hover:bg-cream/50',
                  onPostClick && 'cursor-pointer'
                )}
                onClick={() => onPostClick?.(post)}
              >
                <td className="py-3 pr-4">
                  <div className="max-w-[200px]">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {post.topic || post.hook || 'Untitled'}
                    </p>
                    <p className="text-xs text-stone">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <Badge
                    className={cn('text-white text-xs', PLATFORM_CONFIG[post.platform]?.bgColor)}
                  >
                    {PLATFORM_CONFIG[post.platform]?.name || post.platform}
                  </Badge>
                </td>
                {columns.map(col => (
                  <td key={col.key} className="py-3 pr-4 text-right text-sm text-charcoal tabular-nums">
                    {col.key === 'engagementRate'
                      ? `${(post[col.key] || 0).toFixed(2)}%`
                      : (post[col.key] || 0).toLocaleString()}
                  </td>
                ))}
                <td className="py-3">
                  {post.postUrl && (
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal hover:text-teal/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
