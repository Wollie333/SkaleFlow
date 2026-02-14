'use client';

import {
  XMarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';
import { formatDistanceToNow, format } from 'date-fns';
import { useEffect } from 'react';

export interface PlatformPost {
  postId: string;
  createdAt: string;
  message: string;
  permalink: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  platform: string;
  accountName: string;
  mediaType?: string;
}

interface PostDetailModalProps {
  post: PlatformPost | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone/10">
      <div className={cn('p-2 rounded-lg', bg)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className="text-xs text-stone">{label}</p>
        <p className="text-lg font-bold text-charcoal">{value}</p>
      </div>
    </div>
  );
}

export function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const config = PLATFORM_CONFIG[post.platform as SocialPlatform];
  const totalEngagement = post.likes + post.comments + post.shares;

  // Engagement breakdown percentages
  const likesPct = totalEngagement > 0 ? (post.likes / totalEngagement) * 100 : 0;
  const commentsPct = totalEngagement > 0 ? (post.comments / totalEngagement) * 100 : 0;
  const sharesPct = totalEngagement > 0 ? (post.shares / totalEngagement) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-cream-warm rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-cream-warm z-10 flex items-center justify-between p-6 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${config?.color || '#666'}20` }}
            >
              <span
                className="text-xs font-bold uppercase"
                style={{ color: config?.color || '#666' }}
              >
                {post.platform.slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal">Post Analytics</h3>
              <p className="text-xs text-stone">
                {config?.name || post.platform} &middot; {post.accountName} &middot;{' '}
                {format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Post content */}
          <div className="flex gap-4">
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt=""
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-charcoal leading-relaxed line-clamp-4">
                {post.message || 'No caption'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-stone">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-dark font-medium"
                  >
                    View on {config?.name || post.platform}
                    <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard
              label="Impressions"
              value={formatNumber(post.impressions)}
              icon={EyeIcon}
              color="text-indigo-500"
              bg="bg-indigo-50"
            />
            <MetricCard
              label="Reach"
              value={formatNumber(post.reach)}
              icon={UserGroupIcon}
              color="text-violet-500"
              bg="bg-violet-50"
            />
            <MetricCard
              label="Engagement Rate"
              value={`${post.engagementRate.toFixed(2)}%`}
              icon={ChartBarIcon}
              color="text-teal"
              bg="bg-teal/10"
            />
            <MetricCard
              label="Likes"
              value={formatNumber(post.likes)}
              icon={HeartIcon}
              color="text-pink-500"
              bg="bg-pink-50"
            />
            <MetricCard
              label="Comments"
              value={formatNumber(post.comments)}
              icon={ChatBubbleLeftIcon}
              color="text-gold"
              bg="bg-gold/5"
            />
            <MetricCard
              label="Shares"
              value={formatNumber(post.shares)}
              icon={ShareIcon}
              color="text-orange-500"
              bg="bg-orange-50"
            />
          </div>

          {/* Engagement breakdown bar */}
          {totalEngagement > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-charcoal mb-3">Engagement Breakdown</h4>
              <div className="space-y-3">
                {/* Visual bar */}
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-stone/5">
                  {post.likes > 0 && (
                    <div
                      className="bg-pink-400 h-full transition-all"
                      style={{ width: `${likesPct}%` }}
                      title={`Likes: ${likesPct.toFixed(1)}%`}
                    />
                  )}
                  {post.comments > 0 && (
                    <div
                      className="bg-gold h-full transition-all"
                      style={{ width: `${commentsPct}%` }}
                      title={`Comments: ${commentsPct.toFixed(1)}%`}
                    />
                  )}
                  {post.shares > 0 && (
                    <div
                      className="bg-orange-400 h-full transition-all"
                      style={{ width: `${sharesPct}%` }}
                      title={`Shares: ${sharesPct.toFixed(1)}%`}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-pink-400" />
                    <span className="text-stone">Likes {likesPct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-gold" />
                    <span className="text-stone">Comments {commentsPct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-400" />
                    <span className="text-stone">Shares {sharesPct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              {/* Total engagement */}
              <div className="mt-4 p-3 bg-teal/5 rounded-lg flex items-center justify-between">
                <span className="text-sm text-stone">Total Engagement</span>
                <span className="text-lg font-bold text-teal">{formatNumber(totalEngagement)}</span>
              </div>
            </div>
          )}

          {/* Performance context */}
          {post.impressions > 0 && (
            <div className="bg-white rounded-lg border border-stone/10 p-4">
              <h4 className="text-sm font-semibold text-charcoal mb-2">Performance Notes</h4>
              <ul className="space-y-1.5 text-xs text-stone">
                {post.engagementRate > 5 && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    High engagement — this post is performing well above average.
                  </li>
                )}
                {post.engagementRate >= 2 && post.engagementRate <= 5 && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                    Good engagement — this post is performing at a healthy rate.
                  </li>
                )}
                {post.engagementRate > 0 && post.engagementRate < 2 && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Below average engagement — consider different content formats.
                  </li>
                )}
                {post.reach > 0 && post.impressions > post.reach && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Impressions exceed reach — people are viewing this post multiple times.
                  </li>
                )}
                {post.comments > post.likes * 0.1 && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    Strong comment-to-like ratio — this content is sparking conversation.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
