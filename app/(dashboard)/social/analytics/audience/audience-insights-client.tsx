'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ArrowPathIcon,
  UserGroupIcon,
  GlobeAltIcon,
  MapPinIcon,
  EyeIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import { PLATFORM_CONFIG } from '@/lib/social/types';
import type { SocialPlatform } from '@/types/database';

interface Connection {
  id: string;
  platform: string;
  platform_username?: string | null;
  platform_page_name?: string | null;
  is_active: boolean;
}

interface AudienceInsight {
  platform: SocialPlatform;
  accountName: string;
  followers: number | null;
  demographics: {
    age: Array<{ range: string; percentage: number }>;
    gender: Array<{ type: string; percentage: number }>;
  };
  topCountries: Array<{ country: string; percentage: number }>;
  topCities: Array<{ city: string; percentage: number }>;
  onlineFollowers: Record<string, number[]> | null;
  profileViews: number | null;
  websiteClicks: number | null;
  error?: string;
}

interface AudienceInsightsClientProps {
  organizationId: string;
  connections: Connection[];
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function AudienceInsightsClient({ organizationId, connections }: AudienceInsightsClientProps) {
  const [insights, setInsights] = useState<AudienceInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | SocialPlatform>('all');

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/social/analytics/audience-insights');
      const data = await res.json();
      if (res.ok) {
        setInsights(data.insights || []);
        const errors = (data.insights || []).filter((i: AudienceInsight) => i.error);
        if (errors.length > 0 && errors.length === (data.insights || []).length) {
          setError('Could not fetch audience data from any platform. Check your connection permissions.');
        }
      } else {
        setError(data.error || 'Failed to load audience insights');
      }
    } catch {
      setError('Failed to load audience insights');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (connections.length > 0) {
      fetchInsights();
    } else {
      setIsLoading(false);
    }
  }, [connections.length, fetchInsights]);

  if (connections.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Audience Insights"
        />
        <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
          <p className="text-stone mb-4">No social media accounts connected yet.</p>
        </div>
      </div>
    );
  }

  // Get distinct platforms from insights
  const platforms: SocialPlatform[] = Array.from(
    new Set(insights.map(i => i.platform))
  );

  // Filter insights by active tab
  const visibleInsights = activeTab === 'all'
    ? insights
    : insights.filter(i => i.platform === activeTab);

  // Aggregated totals
  const totalFollowers = insights.reduce((s, i) => s + (i.followers || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Audience Insights"
        />
        <Button
          onClick={fetchInsights}
          disabled={isLoading}
          variant="secondary"
          className="whitespace-nowrap"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Platform tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border-b-2',
            activeTab === 'all'
              ? 'bg-teal/10 text-teal border-teal'
              : 'bg-cream-warm text-stone hover:text-charcoal border-transparent'
          )}
        >
          All Platforms
        </button>
        {platforms.map(platform => {
          const config = PLATFORM_CONFIG[platform];
          const isActive = activeTab === platform;
          return (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                isActive
                  ? 'bg-white text-charcoal'
                  : 'bg-cream-warm text-stone hover:text-charcoal border-transparent'
              )}
              style={isActive ? { borderColor: config.color } : undefined}
            >
              {config.name}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 bg-stone/5 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-stone/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Total Followers Banner */}
          <div className="bg-gradient-to-br from-teal to-teal-dark rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">
                  {activeTab === 'all' ? 'Total Audience (All Platforms)' : `${PLATFORM_CONFIG[activeTab]?.name || activeTab} Audience`}
                </p>
                <h2 className="text-4xl font-bold">
                  {activeTab === 'all'
                    ? formatNumber(totalFollowers)
                    : formatNumber(visibleInsights.reduce((s, i) => s + (i.followers || 0), 0))}
                </h2>
                <p className="text-sm mt-2 opacity-90">
                  Across {activeTab === 'all' ? platforms.length : 1} platform{activeTab === 'all' && platforms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <UserGroupIcon className="w-16 h-16 opacity-30" />
            </div>
          </div>

          {/* Per-platform insights */}
          {visibleInsights.map(insight => (
            <div key={insight.platform} className="space-y-4">
              {activeTab === 'all' && (
                <h3 className="text-heading-md text-charcoal flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PLATFORM_CONFIG[insight.platform]?.color }}
                  />
                  {PLATFORM_CONFIG[insight.platform]?.name || insight.platform}
                  {insight.accountName && (
                    <span className="text-sm font-normal text-stone">({insight.accountName})</span>
                  )}
                </h3>
              )}

              {insight.error ? (
                <Card className="p-6">
                  <p className="text-sm text-stone text-center">{insight.error}</p>
                </Card>
              ) : (
                <>
                  {/* Quick stats row */}
                  {(insight.profileViews !== null || insight.websiteClicks !== null) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {insight.followers !== null && (
                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <UserGroupIcon className="w-4 h-4 text-teal" />
                            <span className="text-xs text-stone">Followers</span>
                          </div>
                          <p className="text-xl font-bold text-charcoal">{formatNumber(insight.followers)}</p>
                        </Card>
                      )}
                      {insight.profileViews !== null && (
                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <EyeIcon className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs text-stone">Profile Views (28d)</span>
                          </div>
                          <p className="text-xl font-bold text-charcoal">{formatNumber(insight.profileViews)}</p>
                        </Card>
                      )}
                      {insight.websiteClicks !== null && (
                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CursorArrowRaysIcon className="w-4 h-4 text-gold" />
                            <span className="text-xs text-stone">Website Clicks (28d)</span>
                          </div>
                          <p className="text-xl font-bold text-charcoal">{formatNumber(insight.websiteClicks)}</p>
                        </Card>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Age Distribution */}
                    {insight.demographics.age.length > 0 && (
                      <Card className="p-6">
                        <h4 className="font-semibold text-charcoal mb-4">
                          {insight.platform === 'linkedin' ? 'Seniority' : 'Age Distribution'}
                        </h4>
                        <div className="space-y-3">
                          {insight.demographics.age.map(item => (
                            <div key={item.range}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-charcoal">{item.range}</span>
                                <span className="text-sm font-semibold text-teal">{item.percentage}%</span>
                              </div>
                              <div className="w-full bg-cream-warm rounded-full h-2">
                                <div
                                  className="bg-teal h-2 rounded-full transition-all"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Gender Distribution */}
                    {insight.demographics.gender.length > 0 && (
                      <Card className="p-6">
                        <h4 className="font-semibold text-charcoal mb-4">Gender Distribution</h4>
                        <div className="space-y-3">
                          {insight.demographics.gender.map(item => (
                            <div key={item.type}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-charcoal">{item.type}</span>
                                <span className="text-sm font-semibold text-teal">{item.percentage}%</span>
                              </div>
                              <div className="w-full bg-cream-warm rounded-full h-2">
                                <div
                                  className="bg-teal h-2 rounded-full transition-all"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Top Countries */}
                    {insight.topCountries.length > 0 && (
                      <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <GlobeAltIcon className="w-5 h-5 text-teal" />
                          <h4 className="font-semibold text-charcoal">Top Countries</h4>
                        </div>
                        <div className="space-y-3">
                          {insight.topCountries.map((item, index) => (
                            <div key={item.country} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone w-5">{index + 1}</span>
                                <span className="text-sm text-charcoal">{item.country}</span>
                              </div>
                              <span className="text-sm font-semibold text-teal">{item.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Top Cities */}
                    {insight.topCities.length > 0 && (
                      <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPinIcon className="w-5 h-5 text-teal" />
                          <h4 className="font-semibold text-charcoal">Top Cities</h4>
                        </div>
                        <div className="space-y-3">
                          {insight.topCities.map((item, index) => (
                            <div key={item.city} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone w-5">{index + 1}</span>
                                <span className="text-sm text-charcoal">{item.city}</span>
                              </div>
                              <span className="text-sm font-semibold text-teal">{item.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Empty state for platform with no demographic data */}
                  {insight.demographics.age.length === 0 && insight.demographics.gender.length === 0 && insight.topCountries.length === 0 && (
                    <Card className="p-6 text-center">
                      <p className="text-sm text-stone">
                        {insight.followers !== null && insight.followers < 100
                          ? 'Audience demographics require at least 100 followers.'
                          : 'No demographic data available. This may require additional API permissions.'}
                      </p>
                    </Card>
                  )}
                </>
              )}
            </div>
          ))}

          {visibleInsights.length === 0 && !isLoading && (
            <Card className="p-12 text-center">
              <p className="text-stone">No audience data available yet.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
