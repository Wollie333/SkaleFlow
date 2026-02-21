'use client';

import { Card } from '@/components/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UsersIcon } from '@heroicons/react/24/outline';
import type { FollowerGrowthPoint } from './types';

// Platform colors matching PLATFORM_CONFIG
const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  tiktok: '#69C9D0',
  youtube: '#FF0000',
};

const PLATFORM_NAMES: Record<string, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

interface FollowerGrowthChartProps {
  data: FollowerGrowthPoint[];
  isLoading?: boolean;
}

export function FollowerGrowthChart({ data, isLoading }: FollowerGrowthChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-heading-md text-charcoal">Follower Growth</h3>
            <p className="text-sm text-stone">Track your audience growth over time</p>
          </div>
        </div>
        <div className="h-[280px] bg-stone/5 rounded-lg animate-pulse" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-heading-md text-charcoal">Follower Growth</h3>
            <p className="text-sm text-stone">Track your audience growth over time</p>
          </div>
        </div>
        <div className="h-[280px] flex items-center justify-center text-stone">
          Follower data will appear after the next analytics sync.
        </div>
      </Card>
    );
  }

  // Group by date, create one line per platform
  const dateMap: Record<string, Record<string, number>> = {};
  const platforms = new Set<string>();

  for (const point of data) {
    const platform = point.social_media_connections?.platform || 'unknown';
    platforms.add(platform);
    if (!dateMap[point.metric_date]) dateMap[point.metric_date] = {};
    dateMap[point.metric_date][platform] = point.followers_count;
  }

  const chartData = Object.entries(dateMap)
    .map(([date, platformValues]) => ({ date, ...platformValues }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const platformList = Array.from(platforms);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h3 className="text-heading-md text-charcoal">Follower Growth</h3>
          <p className="text-sm text-stone">Track your audience growth over time</p>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => {
                const d = new Date(value);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
                if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                return v.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                PLATFORM_NAMES[name] || name,
              ]}
              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}
            />
            <Legend
              formatter={(value: string) => PLATFORM_NAMES[value] || value}
              wrapperStyle={{ fontSize: '12px' }}
            />
            {platformList.map(platform => (
              <Line
                key={platform}
                type="monotone"
                dataKey={platform}
                name={platform}
                stroke={PLATFORM_COLORS[platform] || '#6B7280'}
                strokeWidth={2}
                dot={{ r: 3, fill: PLATFORM_COLORS[platform] || '#6B7280' }}
                activeDot={{ r: 5, fill: PLATFORM_COLORS[platform] || '#6B7280' }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
