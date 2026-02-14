'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import {
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface BenchmarksClientProps {
  benchmarks: any[];
  orgMetrics: any;
  industry: string;
}

const PLATFORMS = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

export function BenchmarksClient({ benchmarks, orgMetrics, industry }: BenchmarksClientProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin');

  // Get benchmarks for selected platform
  const platformBenchmarks = benchmarks.filter(
    (b) => b.platform === selectedPlatform
  );

  // Get org metrics for selected platform
  const platformOrgMetrics = orgMetrics[selectedPlatform] || {
    avgEngagementRate: 0,
    avgImpressions: 0,
    avgReach: 0,
  };

  // Helper to get benchmark value for a metric
  const getBenchmark = (metricName: string, percentile: 'percentile_25' | 'percentile_50' | 'percentile_75') => {
    const benchmark = platformBenchmarks.find((b) => b.metric_name === metricName);
    return benchmark?.[percentile] || 0;
  };

  // Helper to determine performance level
  const getPerformanceLevel = (value: number, metric: string) => {
    const p25 = getBenchmark(metric, 'percentile_25');
    const p50 = getBenchmark(metric, 'percentile_50');
    const p75 = getBenchmark(metric, 'percentile_75');

    if (value >= p75) return { level: 'excellent', color: 'text-green-600', label: 'Top 25%' };
    if (value >= p50) return { level: 'good', color: 'text-teal', label: 'Above Average' };
    if (value >= p25) return { level: 'average', color: 'text-orange-600', label: 'Average' };
    return { level: 'below', color: 'text-red-600', label: 'Below Average' };
  };

  const metrics = [
    {
      name: 'Engagement Rate',
      key: 'engagement_rate',
      orgValue: platformOrgMetrics.avgEngagementRate,
      unit: '%',
    },
    {
      name: 'Impressions',
      key: 'impressions',
      orgValue: platformOrgMetrics.avgImpressions,
      unit: '',
    },
    {
      name: 'Reach',
      key: 'reach',
      orgValue: platformOrgMetrics.avgReach,
      unit: '',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Industry Benchmarks"
        subtitle={`Compare your performance against ${industry} industry standards`}
      />

      {/* Platform Selector */}
      <div className="bg-white rounded-xl border border-stone/10 p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap',
                selectedPlatform === platform
                  ? 'bg-teal text-white'
                  : 'bg-stone/5 text-stone hover:bg-stone/10 hover:text-charcoal'
              )}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Benchmark Cards */}
      {platformBenchmarks.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone/10 rounded-full flex items-center justify-center">
            <ChartBarIcon className="w-8 h-8 text-stone" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            No benchmark data available
          </h3>
          <p className="text-sm text-stone">
            Benchmark data for {selectedPlatform} will be added soon
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {metrics.map((metric) => {
            const p25 = getBenchmark(metric.key, 'percentile_25');
            const p50 = getBenchmark(metric.key, 'percentile_50');
            const p75 = getBenchmark(metric.key, 'percentile_75');
            const performance = getPerformanceLevel(metric.orgValue, metric.key);

            return (
              <div key={metric.key} className="bg-white rounded-xl border border-stone/10 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone/10 bg-stone/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-charcoal">{metric.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-semibold', performance.color)}>
                        {performance.label}
                      </span>
                      {performance.level === 'excellent' ? (
                        <TrophyIcon className="w-5 h-5 text-gold" />
                      ) : performance.level === 'good' ? (
                        <ArrowTrendingUpIcon className="w-5 h-5 text-teal" />
                      ) : performance.level === 'below' ? (
                        <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Comparison */}
                <div className="p-6">
                  {/* Your Performance */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-stone">Your Performance</span>
                      <span className="text-2xl font-bold text-teal">
                        {metric.orgValue.toFixed(2)}
                        {metric.unit}
                      </span>
                    </div>
                    <div className="h-3 bg-stone/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal to-teal-dark"
                        style={{
                          width: `${Math.min((metric.orgValue / (p75 * 1.5)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Benchmark Percentiles */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* 25th Percentile */}
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 mb-1">25th Percentile</p>
                      <p className="text-lg font-bold text-red-700">
                        {p25.toFixed(2)}
                        {metric.unit}
                      </p>
                      <p className="text-xs text-red-600 mt-1">Bottom 25%</p>
                    </div>

                    {/* 50th Percentile (Median) */}
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-orange-700 mb-1">50th Percentile</p>
                      <p className="text-lg font-bold text-orange-700">
                        {p50.toFixed(2)}
                        {metric.unit}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">Median</p>
                    </div>

                    {/* 75th Percentile */}
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-700 mb-1">75th Percentile</p>
                      <p className="text-lg font-bold text-green-700">
                        {p75.toFixed(2)}
                        {metric.unit}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Top 25%</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  {performance.level !== 'excellent' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-900">
                        <strong>💡 Recommendation:</strong>{' '}
                        {performance.level === 'below'
                          ? `Focus on improving your ${metric.name.toLowerCase()}. Aim to reach at least the median (${p50.toFixed(2)}${metric.unit}) to match industry standards.`
                          : `You're performing well! To reach the top 25%, aim for ${p75.toFixed(2)}${metric.unit} or higher.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple/20 p-6">
        <h3 className="font-semibold text-charcoal mb-2">How Benchmarks Work</h3>
        <div className="space-y-2 text-sm text-stone">
          <p>
            <strong className="text-charcoal">25th Percentile:</strong> 75% of companies perform
            better than this
          </p>
          <p>
            <strong className="text-charcoal">50th Percentile (Median):</strong> The middle value -
            half perform better, half perform worse
          </p>
          <p>
            <strong className="text-charcoal">75th Percentile:</strong> Only 25% of companies
            perform better than this - you're in the top quartile!
          </p>
        </div>
      </div>
    </div>
  );
}
