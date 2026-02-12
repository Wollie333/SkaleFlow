'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui';
import {
  ArrowPathIcon,
  UserGroupIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface Connection {
  id: string;
  platform: string;
  platform_username?: string;
  platform_page_name?: string;
  is_active: boolean;
}

interface AudienceInsightsClientProps {
  organizationId: string;
  connections: Connection[];
}

type DateRangePreset = '7days' | '30days' | '90days';

export function AudienceInsightsClient({ organizationId, connections }: AudienceInsightsClientProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30days');

  // Placeholder data - in a real implementation, this would come from the API
  const audienceData = {
    totalFollowers: 12453,
    growthRate: 8.5,
    demographics: {
      age: [
        { range: '18-24', percentage: 25 },
        { range: '25-34', percentage: 42 },
        { range: '35-44', percentage: 20 },
        { range: '45-54', percentage: 8 },
        { range: '55+', percentage: 5 },
      ],
      gender: [
        { type: 'Female', percentage: 58 },
        { type: 'Male', percentage: 40 },
        { type: 'Other', percentage: 2 },
      ],
    },
    topLocations: [
      { country: 'United States', percentage: 35 },
      { country: 'United Kingdom', percentage: 18 },
      { country: 'Canada', percentage: 12 },
      { country: 'Australia', percentage: 10 },
      { country: 'South Africa', percentage: 8 },
      { country: 'Others', percentage: 17 },
    ],
    devices: [
      { type: 'Mobile', percentage: 72 },
      { type: 'Desktop', percentage: 22 },
      { type: 'Tablet', percentage: 6 },
    ],
    peakActivity: [
      { day: 'Monday', hour: '9:00 AM', percentage: 15 },
      { day: 'Wednesday', hour: '2:00 PM', percentage: 18 },
      { day: 'Friday', hour: '5:00 PM', percentage: 22 },
      { day: 'Sunday', hour: '8:00 PM', percentage: 12 },
    ],
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (connections.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <PageHeader
          title="Audience Insights"
          description="Understand your social media audience demographics and behavior"
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
            title="Audience Insights"
            description="Demographics and behavior patterns of your audience"
          />
          <Button
            onClick={() => setIsFetching(true)}
            disabled={isFetching}
            variant="secondary"
            className="whitespace-nowrap"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Loading...' : 'Refresh Data'}
          </Button>
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
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Total Followers */}
      <div className="bg-gradient-to-br from-teal to-teal-dark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Total Audience</p>
            <h2 className="text-4xl font-bold">{formatNumber(audienceData.totalFollowers)}</h2>
            <p className="text-sm mt-2 opacity-90">
              <span className="font-semibold">+{audienceData.growthRate}%</span> growth this period
            </p>
          </div>
          <UserGroupIcon className="w-16 h-16 opacity-30" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div className="bg-white rounded-xl border border-stone/10 p-6">
          <h3 className="font-semibold text-charcoal mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {audienceData.demographics.age.map((item) => (
              <div key={item.range}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-charcoal">{item.range} years</span>
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
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl border border-stone/10 p-6">
          <h3 className="font-semibold text-charcoal mb-4">Gender Distribution</h3>
          <div className="space-y-3">
            {audienceData.demographics.gender.map((item) => (
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
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl border border-stone/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <GlobeAltIcon className="w-5 h-5 text-teal" />
            <h3 className="font-semibold text-charcoal">Top Locations</h3>
          </div>
          <div className="space-y-3">
            {audienceData.topLocations.map((item, index) => (
              <div key={item.country} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone w-5">{index + 1}</span>
                  <span className="text-sm text-charcoal">{item.country}</span>
                </div>
                <span className="text-sm font-semibold text-teal">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-xl border border-stone/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DevicePhoneMobileIcon className="w-5 h-5 text-teal" />
            <h3 className="font-semibold text-charcoal">Device Usage</h3>
          </div>
          <div className="space-y-3">
            {audienceData.devices.map((item) => (
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
        </div>
      </div>

      {/* Peak Activity Times */}
      <div className="bg-white rounded-xl border border-stone/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-teal" />
          <h3 className="font-semibold text-charcoal">Peak Activity Times</h3>
        </div>
        <p className="text-sm text-stone mb-4">When your audience is most active</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {audienceData.peakActivity.map((item) => (
            <div key={`${item.day}-${item.hour}`} className="p-4 bg-cream-warm rounded-lg">
              <p className="text-sm font-semibold text-charcoal">{item.day}</p>
              <p className="text-xs text-stone mb-2">{item.hour}</p>
              <p className="text-lg font-bold text-teal">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Note about data */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Audience insights are aggregated from all connected social media platforms.
          Data availability varies by platform and requires appropriate permissions.
        </p>
      </div>
    </div>
  );
}
