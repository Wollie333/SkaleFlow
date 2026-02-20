'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
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
import { CHART_METRICS } from '@/lib/analytics/platform-metrics';
import type { MetricKey } from '@/lib/analytics/platform-metrics';
import type { SocialPlatform } from '@/types/database';

interface TimeSeriesPoint {
  date: string;
  engagement: number;
  impressions: number;
  reach: number;
  clicks: number;
  saves: number;
  videoViews: number;
  likes: number;
  comments: number;
  shares: number;
  byPlatform: Record<string, {
    engagement: number;
    impressions: number;
    reach: number;
    clicks: number;
    saves: number;
    videoViews: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

interface PerformanceChartProps {
  data: TimeSeriesPoint[];
  isLoading?: boolean;
  platformFilter?: SocialPlatform;
  availableMetrics?: MetricKey[];
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

function formatTooltipValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function PerformanceChart({ data, isLoading, platformFilter, availableMetrics }: PerformanceChartProps) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(() => {
    const set = new Set<string>();
    set.add('engagement');
    set.add('impressions');
    return set;
  });

  const toggleLine = (key: string) => {
    const next = new Set(visibleLines);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleLines(next);
  };

  // Filter chart metrics to only those available for this platform
  const activeChartMetrics = availableMetrics
    ? CHART_METRICS.filter(m => availableMetrics.includes(m.key))
    : CHART_METRICS;

  // Transform data for platform-filtered view
  const chartData = platformFilter
    ? data.map(point => {
        const pd = point.byPlatform[platformFilter];
        return {
          date: point.date,
          engagement: pd?.engagement || 0,
          impressions: pd?.impressions || 0,
          reach: pd?.reach || 0,
          clicks: pd?.clicks || 0,
          saves: pd?.saves || 0,
          videoViews: pd?.videoViews || 0,
        };
      })
    : data;

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Performance Over Time</h3>
        <div className="h-[300px] bg-stone/5 rounded-lg animate-pulse" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Performance Over Time</h3>
        <div className="h-[300px] flex items-center justify-center text-stone">
          No data yet. Publish content and check back later.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-heading-md text-charcoal">Performance Over Time</h3>
        <div className="flex gap-2 flex-wrap">
          {activeChartMetrics.map(line => (
            <button
              key={line.key}
              type="button"
              onClick={() => toggleLine(line.key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border',
                visibleLines.has(line.key)
                  ? 'border-transparent'
                  : 'border-stone/20 bg-cream-warm text-stone opacity-50'
              )}
              style={
                visibleLines.has(line.key)
                  ? { backgroundColor: `${line.color}15`, color: line.color }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              {line.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxisValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
              formatter={((value: number, name: string) => [
                formatTooltipValue(Number(value) || 0),
                String(name),
              ]) as any}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }}
              labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}
            />
            <Legend content={() => null} />
            {activeChartMetrics.map(line =>
              visibleLines.has(line.key) ? (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: line.color }}
                  activeDot={{ r: 5, fill: line.color }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
