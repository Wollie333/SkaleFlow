'use client';

import { useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ArrowPathIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';
import type { PlatformPost } from '@/components/social/post-detail-modal';

interface PlatformHistorySectionProps {
  platform: SocialPlatform;
  onPostClick: (post: PlatformPost) => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function PlatformHistorySection({ platform, onPostClick }: PlatformHistorySectionProps) {
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformName = PLATFORM_CONFIG[platform]?.name || platform;
  const platformColor = PLATFORM_CONFIG[platform]?.color || '#666';

  const fetchPosts = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch('/api/social/analytics/fetch-platform-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to fetch platform posts');
        return;
      }

      // Filter to the active platform
      const filtered = (json.posts || []).filter(
        (p: PlatformPost) => p.platform === platform
      );
      setPosts(filtered);
      setHasFetched(true);

      if (json.errors && json.errors.length > 0) {
        const platformError = json.errors.find(
          (e: { platform: string }) => e.platform === platform
        );
        if (platformError && filtered.length === 0) {
          setError(platformError.error);
        }
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setIsFetching(false);
    }
  }, [platform]);

  // Not yet fetched — show fetch button
  if (!hasFetched && !isFetching) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-heading-md text-charcoal">Platform Post History</h3>
          <span
            className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-white rounded-full"
            style={{ backgroundColor: platformColor }}
          >
            {platformName}
          </span>
        </div>
        <p className="text-sm text-stone mb-4">
          Fetch your recent posts directly from {platformName} to view detailed analytics for each post.
        </p>
        <Button onClick={fetchPosts} variant="outline" className="gap-2">
          <ArrowPathIcon className="w-4 h-4" />
          Fetch {platformName} Posts
        </Button>
      </Card>
    );
  }

  // Loading state
  if (isFetching) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Platform Post History</h3>
        <div className="flex items-center gap-3 text-stone">
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
          <span className="text-sm">Fetching posts from {platformName}...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-stone/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Platform Post History</h3>
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchPosts}
              className="text-xs text-red-600 hover:text-red-800 underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Fetched, no posts
  if (hasFetched && posts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading-md text-charcoal">Platform Post History</h3>
          <Button onClick={fetchPosts} variant="ghost" size="sm" className="gap-1.5">
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-stone text-center py-8">
          No posts found on {platformName}. Posts will appear here once you start publishing.
        </p>
      </Card>
    );
  }

  // Fetched with posts — show grid
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading-md text-charcoal">Platform Post History</h3>
          <p className="text-xs text-stone mt-0.5">{posts.length} posts from {platformName} — click to view details</p>
        </div>
        <Button onClick={fetchPosts} variant="ghost" size="sm" className="gap-1.5">
          <ArrowPathIcon className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {posts.map((post) => (
          <button
            key={post.postId}
            onClick={() => onPostClick(post)}
            className="text-left bg-cream-warm rounded-xl border border-stone/10 hover:border-stone/20 hover:shadow-md transition-all p-4 group"
          >
            {/* Thumbnail + content */}
            <div className="flex gap-3 mb-3">
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${platformColor}10` }}
                >
                  <span
                    className="text-xs font-bold uppercase"
                    style={{ color: platformColor }}
                  >
                    {platform.slice(0, 2)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-charcoal leading-relaxed line-clamp-3">
                  {post.message || 'No caption'}
                </p>
              </div>
            </div>

            {/* Date */}
            <p className="text-[10px] text-stone mb-2">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

            {/* Metrics row */}
            <div className="flex items-center gap-3 text-xs text-stone">
              <span className="flex items-center gap-1">
                <HeartIcon className="w-3 h-3 text-pink-400" />
                {formatNumber(post.likes)}
              </span>
              <span className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-3 h-3 text-gold" />
                {formatNumber(post.comments)}
              </span>
              <span className="flex items-center gap-1">
                <ShareIcon className="w-3 h-3 text-orange-400" />
                {formatNumber(post.shares)}
              </span>
              {post.impressions > 0 && (
                <span className="flex items-center gap-1 ml-auto">
                  <EyeIcon className="w-3 h-3 text-indigo-400" />
                  {formatNumber(post.impressions)}
                </span>
              )}
            </div>

            {/* Engagement rate badge */}
            {post.engagementRate > 0 && (
              <div className="mt-2">
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold',
                    post.engagementRate > 5
                      ? 'bg-green-50 text-green-700'
                      : post.engagementRate >= 2
                      ? 'bg-teal/10 text-teal'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  {post.engagementRate.toFixed(1)}% engagement
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
