'use client';

import { Card } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import type { CategoryComparison } from '@/lib/brand-audit/comparison';

interface ComparisonViewProps {
  categories: CategoryComparison[];
  overallPrevious: number;
  overallCurrent: number;
  overallChange: number;
}

export function ComparisonView({ categories, overallPrevious, overallCurrent, overallChange }: ComparisonViewProps) {
  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return <MinusIcon className="w-4 h-4 text-stone" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-stone';
  };

  return (
    <div className="space-y-6">
      {/* Overall */}
      <Card className="p-6 border border-stone/10 bg-gradient-to-r from-cream-warm to-white">
        <h3 className="font-semibold text-charcoal mb-4">Overall Brand Health</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-stone">{Math.round(overallPrevious)}</div>
            <div className="text-xs text-stone mt-1">Previous</div>
          </div>
          <div className="flex items-center gap-2">
            {getChangeIcon(overallChange)}
            <span className={`text-2xl font-bold ${getChangeColor(overallChange)}`}>
              {overallChange > 0 ? '+' : ''}{Math.round(overallChange)}
            </span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal">{Math.round(overallCurrent)}</div>
            <div className="text-xs text-stone mt-1">Current</div>
          </div>
        </div>
      </Card>

      {/* Per-category */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <Card key={cat.category} className="p-4 border border-stone/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="font-medium text-sm text-charcoal w-48">{cat.label}</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone w-8 text-right">{Math.round(cat.previousScore)}</span>
                  <span className="text-stone">→</span>
                  <span className="font-semibold text-charcoal w-8">{Math.round(cat.currentScore)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getChangeIcon(cat.change)}
                <span className={`text-sm font-semibold ${getChangeColor(cat.change)}`}>
                  {cat.change > 0 ? '+' : ''}{Math.round(cat.change)}
                </span>
              </div>
            </div>

            {/* Progress bar comparison */}
            <div className="mt-2 relative h-2 bg-stone/10 rounded-full overflow-hidden">
              {/* Previous (faded) */}
              <div
                className="absolute top-0 left-0 h-full bg-stone/20 rounded-full"
                style={{ width: `${cat.previousScore}%` }}
              />
              {/* Current */}
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${
                  cat.currentRating === 'green' ? 'bg-green-500' :
                  cat.currentRating === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${cat.currentScore}%` }}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
