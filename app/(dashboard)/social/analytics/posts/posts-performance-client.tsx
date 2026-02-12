'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button, Input } from '@/components/ui';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns';

interface Connection {
  id: string;
  platform: string;
  platform_username?: string;
  platform_page_name?: string;
  is_active: boolean;
}

interface PlatformPost {
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
}

interface PostsPerformanceClientProps {
  organizationId: string;
  connections: Connection[];
}

type DateRangePreset = '7days' | '30days' | '90days' | 'custom';
type SortField = 'date' | 'engagement' | 'impressions' | 'reach';
type SortDirection = 'asc' | 'desc';

export function PostsPerformanceClient({ organizationId, connections }: PostsPerformanceClientProps) {
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchPlatformPosts = async () => {
    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch('/api/social/analytics/fetch-platform-posts', {
        method: 'POST',
      });

      const data = await response.json();

      console.log('Analytics API Response:', data);

      if (response.ok) {
        setPosts(data.posts || []);

        // Show errors if any platforms failed
        if (data.errors && data.errors.length > 0) {
          const errorMessage = `Some platforms failed to fetch:\n${data.errors.map((e: any) => `${e.platform}: ${e.error}`).join('\n')}`;
          setError(errorMessage);
        } else if (data.posts.length === 0) {
          setError('No posts found. Make sure your connected accounts have published posts and Pages are selected in Settings.');
        }
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch platform posts. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (connections.length > 0) {
      fetchPlatformPosts();
    } else {
      setIsFetching(false);
    }
  }, [connections.length]);

  // Get date range based on preset or custom selection
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    if (dateRangePreset === 'custom') {
      startDate = startOfDay(new Date(customStartDate));
      endDate = endOfDay(new Date(customEndDate));
    } else {
      const days = dateRangePreset === '7days' ? 7 : dateRangePreset === '30days' ? 30 : 90;
      startDate = startOfDay(subDays(now, days));
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Filter and sort posts
  const filteredPosts = posts
    .filter((post) => {
      const postDate = new Date(post.createdAt);
      const inDateRange = postDate >= startDate && postDate <= endDate;
      const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
      const matchesSearch = searchQuery === '' || post.message.toLowerCase().includes(searchQuery.toLowerCase());
      return inDateRange && matchesPlatform && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'engagement':
          comparison = a.engagementRate - b.engagementRate;
          break;
        case 'impressions':
          comparison = a.impressions - b.impressions;
          break;
        case 'reach':
          comparison = a.reach - b.reach;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const platforms = Array.from(new Set(posts.map(p => p.platform)));

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (connections.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Post Performance"
          description="Detailed analytics for each social media post"
        />
        <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
          <p className="text-stone mb-4">No social media accounts connected yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Post Performance"
            description={`Detailed analytics for ${filteredPosts.length} posts`}
          />
          <Button
            onClick={fetchPlatformPosts}
            disabled={isFetching}
            variant="secondary"
            className="whitespace-nowrap"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 border border-stone/20 rounded-lg text-sm bg-white"
          >
            <option value="all">All Platforms</option>
            {platforms.map(platform => (
              <option key={platform} value={platform} className="capitalize">
                {platform}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-stone/10 p-1">
            <button
              onClick={() => setDateRangePreset('7days')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRangePreset === '7days'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRangePreset('30days')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRangePreset === '30days'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRangePreset('90days')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRangePreset === '90days'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              Last 90 days
            </button>
            <button
              onClick={() => {
                setDateRangePreset('custom');
                setShowDatePicker(!showDatePicker);
              }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                dateRangePreset === 'custom'
                  ? 'bg-teal text-white'
                  : 'text-stone hover:bg-cream-warm'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Custom
            </button>
          </div>

          {/* Custom Date Picker */}
          {dateRangePreset === 'custom' && showDatePicker && (
            <div className="flex items-center gap-2 bg-white rounded-lg border border-stone/10 p-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone font-medium">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate}
                  className="px-2 py-1 border border-stone/20 rounded text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone font-medium">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="px-2 py-1 border border-stone/20 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-xl border border-stone/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-warm border-b border-stone/10">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-charcoal">Post</th>
                <th
                  className="text-left p-4 text-sm font-semibold text-charcoal cursor-pointer hover:text-teal"
                  onClick={() => toggleSort('date')}
                >
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-charcoal">Platform</th>
                <th
                  className="text-right p-4 text-sm font-semibold text-charcoal cursor-pointer hover:text-teal"
                  onClick={() => toggleSort('impressions')}
                >
                  Impressions {sortField === 'impressions' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-4 text-sm font-semibold text-charcoal cursor-pointer hover:text-teal"
                  onClick={() => toggleSort('reach')}
                >
                  Reach {sortField === 'reach' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-4 text-sm font-semibold text-charcoal cursor-pointer hover:text-teal"
                  onClick={() => toggleSort('engagement')}
                >
                  Engagement {sortField === 'engagement' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right p-4 text-sm font-semibold text-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-stone">
                    {isFetching ? 'Loading posts...' : 'No posts found for the selected filters'}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.postId} className="border-b border-stone/5 hover:bg-cream/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-start gap-3 max-w-md">
                        {post.imageUrl && (
                          <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-charcoal line-clamp-2">{post.message || 'No caption'}</p>
                          <p className="text-xs text-stone mt-1">{post.accountName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-charcoal">{format(new Date(post.createdAt), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-stone">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-1 rounded-full bg-teal/10 text-teal text-xs font-medium capitalize">
                        {post.platform}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-semibold text-charcoal">{formatNumber(post.impressions)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-semibold text-charcoal">{formatNumber(post.reach)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div>
                        <p className="text-sm font-semibold text-teal">{post.engagementRate.toFixed(2)}%</p>
                        <div className="flex items-center justify-end gap-2 text-xs text-stone mt-1">
                          <span>❤️ {formatNumber(post.likes)}</span>
                          <span>💬 {formatNumber(post.comments)}</span>
                          <span>🔄 {formatNumber(post.shares)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-dark font-medium"
                        >
                          View <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
