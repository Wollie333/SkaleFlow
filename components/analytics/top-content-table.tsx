'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';

interface ContentRow {
  id: string;
  platform: SocialPlatform;
  topic: string | null;
  hook: string | null;
  publishedAt: string;
  postUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
}

interface TopContentTableProps {
  posts: ContentRow[];
  isLoading?: boolean;
  onPostClick?: (post: ContentRow) => void;
}

type SortKey = 'engagementRate' | 'likes' | 'comments' | 'shares' | 'impressions';

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export function TopContentTable({ posts, isLoading, onPostClick }: TopContentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('engagementRate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...posts].sort((a, b) => {
    const diff = (a[sortKey] || 0) - (b[sortKey] || 0);
    return sortDir === 'desc' ? -diff : diff;
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronDownIcon className="w-3 h-3 text-stone/40" />;
    return sortDir === 'desc'
      ? <ChevronDownIcon className="w-3 h-3 text-teal" />
      : <ChevronUpIcon className="w-3 h-3 text-teal" />;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
            <TrophyIcon className="w-5 h-5 text-gold" />
          </div>
          <h3 className="text-heading-md text-charcoal">Top Performing Content</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-stone/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
          <TrophyIcon className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-heading-md text-charcoal">Top Performing Content</h3>
          <p className="text-sm text-stone">Click a column header to sort</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="py-8 text-center text-stone">No published content in this period.</div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone/10">
                <th className="text-left py-3 pr-4 text-stone font-medium">Content</th>
                <th className="text-left py-3 px-3 text-stone font-medium">Platform</th>
                {(['likes', 'comments', 'shares', 'impressions', 'engagementRate'] as SortKey[]).map(key => (
                  <th
                    key={key}
                    className="text-right py-3 px-3 text-stone font-medium cursor-pointer hover:text-charcoal transition-colors select-none"
                    onClick={() => handleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {key === 'engagementRate' ? 'Eng. Rate' : key.charAt(0).toUpperCase() + key.slice(1)}
                      <SortIcon column={key} />
                    </span>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 10).map((post, idx) => {
                const config = PLATFORM_CONFIG[post.platform];
                return (
                  <tr
                    key={post.id}
                    className={cn(
                      'border-b border-stone/5 hover:bg-teal/5 transition-colors cursor-pointer',
                      idx === 0 && 'bg-gold/5'
                    )}
                    onClick={() => onPostClick?.(post)}
                  >
                    <td className="py-3 pr-4 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        {idx < 3 && (
                          <span className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                            idx === 0 ? 'bg-gold text-white' : 'bg-stone/10 text-stone'
                          )}>
                            {idx + 1}
                          </span>
                        )}
                        <span className="truncate text-charcoal font-medium">
                          {post.topic || post.hook || 'Untitled'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: config?.color || '#6B7280' }}
                      >
                        {config?.name || post.platform}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-charcoal">{formatCompact(post.likes)}</td>
                    <td className="py-3 px-3 text-right text-charcoal">{formatCompact(post.comments)}</td>
                    <td className="py-3 px-3 text-right text-charcoal">{formatCompact(post.shares)}</td>
                    <td className="py-3 px-3 text-right text-charcoal">{formatCompact(post.impressions)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-teal">{post.engagementRate.toFixed(2)}%</td>
                    <td className="py-3 pl-2">
                      {post.postUrl && (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-stone hover:text-teal transition-colors"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
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
    </Card>
  );
}
