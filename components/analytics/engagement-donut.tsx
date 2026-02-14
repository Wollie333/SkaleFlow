'use client';

import { Card } from '@/components/ui';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface EngagementDonutProps {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  isLoading?: boolean;
}

const COLORS: Record<string, string> = {
  Likes: '#0d9488',
  Comments: '#D4A84B',
  Shares: '#6366f1',
  Saves: '#ec4899',
};

export function EngagementDonut({ likes, comments, shares, saves, isLoading }: EngagementDonutProps) {
  const total = likes + comments + shares + saves;

  const segments = [
    { name: 'Likes', value: likes },
    { name: 'Comments', value: comments },
    { name: 'Shares', value: shares },
    { name: 'Saves', value: saves },
  ].filter(s => s.value > 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Engagement Breakdown</h3>
        <div className="h-[260px] bg-stone/5 rounded-lg animate-pulse" />
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-heading-md text-charcoal mb-4">Engagement Breakdown</h3>
        <div className="h-[260px] flex items-center justify-center text-stone text-sm">
          No engagement data yet.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-heading-md text-charcoal mb-4">Engagement Breakdown</h3>
      <div className="h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {segments.map(entry => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: number, name: string) =>
                [`${value.toLocaleString()} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]
              ) as any}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl font-bold text-charcoal">{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}</p>
            <p className="text-xs text-stone">Total</p>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {segments.map(s => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[s.name] }} />
            <span className="text-xs text-stone">{s.name}</span>
            <span className="text-xs font-semibold text-charcoal ml-auto">
              {s.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
