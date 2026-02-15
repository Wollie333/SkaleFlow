'use client';

import type { CrmLifecycleStage } from '@/types/database';

const stageConfig: { key: CrmLifecycleStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Leads', color: '#9CA3AF' },
  { key: 'prospect', label: 'Prospects', color: '#3B82F6' },
  { key: 'opportunity', label: 'Opportunities', color: '#F59E0B' },
  { key: 'customer', label: 'Customers', color: '#14B8A6' },
  { key: 'churned', label: 'Churned', color: '#EF4444' },
];

interface LifecycleFunnelChartProps {
  data: Record<CrmLifecycleStage, number>;
}

export function LifecycleFunnelChart({ data }: LifecycleFunnelChartProps) {
  const maxCount = Math.max(...Object.values(data), 1);

  return (
    <div className="space-y-3">
      {stageConfig.map(({ key, label, color }) => {
        const count = data[key] || 0;
        const pct = (count / maxCount) * 100;
        return (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-charcoal">{label}</span>
              <span className="text-stone">{count}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
