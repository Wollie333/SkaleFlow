'use client';

import { Card } from '@/components/ui';
import {
  UserGroupIcon,
  GlobeAltIcon,
  MapPinIcon,
  EyeIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import type { SocialPlatform } from '@/types/database';

export interface AudienceInsight {
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

interface AudienceInsightsPanelProps {
  insight: AudienceInsight | null;
  isLoading: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function AudienceInsightsPanel({ insight, isLoading }: AudienceInsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-heading-md text-charcoal">Audience Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-stone/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <Card className="p-6 text-center">
        <UserGroupIcon className="w-8 h-8 text-stone/30 mx-auto mb-2" />
        <p className="text-sm text-stone">Audience insights not available for this platform.</p>
      </Card>
    );
  }

  if (insight.error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-stone">{insight.error}</p>
      </Card>
    );
  }

  const hasStats = insight.profileViews !== null || insight.websiteClicks !== null;
  const hasDemographics = insight.demographics.age.length > 0 || insight.demographics.gender.length > 0;
  const hasGeo = insight.topCountries.length > 0 || insight.topCities.length > 0;
  const hasAnything = hasStats || hasDemographics || hasGeo || insight.followers !== null;

  if (!hasAnything) {
    return (
      <Card className="p-6 text-center">
        <UserGroupIcon className="w-8 h-8 text-stone/30 mx-auto mb-2" />
        <p className="text-sm text-stone">
          {insight.followers !== null && insight.followers < 100
            ? 'Audience demographics require at least 100 followers.'
            : 'No audience data available. This may require additional API permissions.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-heading-md text-charcoal flex items-center gap-2">
        <UserGroupIcon className="w-5 h-5 text-teal" />
        Audience Insights
        {insight.accountName && (
          <span className="text-sm font-normal text-stone">({insight.accountName})</span>
        )}
      </h3>

      {/* Quick stats row */}
      {(insight.followers !== null || hasStats) && (
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

      {/* Demographics + Geography grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Age / Seniority Distribution */}
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
    </div>
  );
}
