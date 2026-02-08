'use client';

import { Card } from '@/components/ui';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface TimeSeriesPoint {
  date: string;
  engagement: number;
  impressions: number;
}

interface PerformanceChartProps {
  data: TimeSeriesPoint[];
  isLoading?: boolean;
}

export function PerformanceChart({ data, isLoading }: PerformanceChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Engagement Over Time</h3>
        <div className="h-[300px] bg-stone/5 rounded-lg animate-pulse" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Engagement Over Time</h3>
        <div className="h-[300px] flex items-center justify-center text-stone">
          No data yet. Publish content and check back later.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-heading-md text-charcoal mb-4">Engagement Over Time</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#737373' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#737373' }} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }}
            />
            <Area
              type="monotone"
              dataKey="engagement"
              name="Engagement"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="impressions"
              name="Impressions"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.05}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
