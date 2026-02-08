'use client';

import { useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
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

interface PerformanceChartProps {
  data: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
  }>;
}

const LINE_CONFIG = [
  { key: 'impressions', label: 'Impressions', color: '#1DA1A6' }, // teal
  { key: 'clicks', label: 'Clicks', color: '#D4A84B' }, // gold
  { key: 'spend', label: 'Spend (cents)', color: '#4B5563' }, // charcoal
] as const;

function formatTooltipValue(value: number, name: string): string {
  if (name === 'Spend (cents)') return formatCurrency(value);
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(() => {
    const set = new Set<string>();
    LINE_CONFIG.forEach((l) => set.add(l.key));
    return set;
  });

  const toggleLine = (key: string) => {
    const next = new Set(visibleLines);
    if (next.has(key)) {
      // Don't allow hiding all lines
      if (next.size > 1) {
        next.delete(key);
      }
    } else {
      next.add(key);
    }
    setVisibleLines(next);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-teal/8 p-6">
        <h3 className="text-sm font-semibold text-charcoal mb-4">Performance Over Time</h3>
        <div className="flex items-center justify-center h-64 text-stone text-sm">
          No performance data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-teal/8 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-charcoal">Performance Over Time</h3>
        <div className="flex gap-2">
          {LINE_CONFIG.map((line) => (
            <button
              key={line.key}
              type="button"
              onClick={() => toggleLine(line.key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border',
                visibleLines.has(line.key)
                  ? 'border-transparent'
                  : 'border-stone/20 bg-white text-stone opacity-50'
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

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toString();
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
            formatter={((value: any, name: any) => [
              formatTooltipValue(Number(value) || 0, String(name)),
              String(name),
            ]) as any}
            labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}
          />
          <Legend content={() => null} />
          {LINE_CONFIG.map((line) =>
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
  );
}
