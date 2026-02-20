'use client';

interface AnalyticsChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
  title?: string;
}

export function AnalyticsChart({ data, type, title }: AnalyticsChartProps) {
  // Placeholder component - will be enhanced with actual charting library
  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 p-6">
      {title && <h3 className="font-semibold text-charcoal mb-4">{title}</h3>}
      <div className="h-64 flex items-center justify-center bg-stone/5 rounded-lg">
        <p className="text-sm text-stone">Chart visualization ({type})</p>
      </div>
    </div>
  );
}
