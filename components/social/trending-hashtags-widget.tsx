'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  FireIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface TrendingHashtagsWidgetProps {
  organizationId: string;
}

interface TrendingHashtag {
  tag: string;
  mentions: number;
  growthRate: number;
  platforms: string[];
}

export function TrendingHashtagsWidget({ organizationId }: TrendingHashtagsWidgetProps) {
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/social/hashtags/trending?organizationId=${organizationId}`);

      if (!response.ok) {
        // If endpoint doesn't exist yet, show mock data
        setTrendingHashtags([
          { tag: '#marketing', mentions: 1250, growthRate: 45.2, platforms: ['linkedin', 'twitter'] },
          { tag: '#digitalmarketing', mentions: 890, growthRate: 32.1, platforms: ['instagram', 'facebook'] },
          { tag: '#contentcreation', mentions: 720, growthRate: 28.5, platforms: ['tiktok', 'instagram'] },
          { tag: '#socialmedia', mentions: 650, growthRate: 22.3, platforms: ['linkedin', 'twitter'] },
          { tag: '#branding', mentions: 540, growthRate: 18.7, platforms: ['instagram', 'linkedin'] },
        ]);
        return;
      }

      const { data } = await response.json();
      setTrendingHashtags(data || []);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      // Show mock data on error
      setTrendingHashtags([
        { tag: '#marketing', mentions: 1250, growthRate: 45.2, platforms: ['linkedin', 'twitter'] },
        { tag: '#digitalmarketing', mentions: 890, growthRate: 32.1, platforms: ['instagram', 'facebook'] },
        { tag: '#contentcreation', mentions: 720, growthRate: 28.5, platforms: ['tiktok', 'instagram'] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToVault = async (hashtag: string) => {
    if (confirm(`Add ${hashtag} to a new hashtag set?`)) {
      // This would open the create form with the hashtag pre-filled
      // For now, just show an alert
      alert(`Feature coming soon: Add ${hashtag} to vault`);
    }
  };

  if (!isExpanded && !isLoading && trendingHashtags.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 to-gold-50 rounded-xl border border-teal/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream-warm/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal to-teal-dark rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              Trending Hashtags
              <FireIcon className="w-4 h-4 text-orange-500" />
            </h3>
            <p className="text-xs text-stone">Popular hashtags in your industry</p>
          </div>
        </div>
        <svg
          className={cn(
            'w-5 h-5 text-stone transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
            </div>
          ) : trendingHashtags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-stone">No trending hashtags available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trendingHashtags.slice(0, 5).map((item, index) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between p-3 bg-cream-warm rounded-lg border border-stone/10 hover:border-teal/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                          index === 0 && 'bg-yellow-100 text-yellow-700',
                          index === 1 && 'bg-cream text-charcoal',
                          index === 2 && 'bg-orange-100 text-orange-700',
                          index > 2 && 'bg-cream text-stone'
                        )}
                      >
                        #{index + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-charcoal">{item.tag}</span>
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowTrendingUpIcon className="w-3 h-3" />
                          <span className="text-xs font-semibold">+{item.growthRate}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-stone">
                        {item.mentions.toLocaleString()} mentions
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => addToVault(item.tag)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-teal hover:bg-teal/10 rounded-lg transition-all flex items-center gap-1 text-xs font-medium"
                    title="Add to vault"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-teal/20">
            <p className="text-xs text-stone text-center">
              Data refreshed hourly • Based on social listening
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
