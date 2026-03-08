'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

// ---- Types ----

interface Adjustment {
  id: string;
  campaign_id: string;
  trigger_type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'dismissed';
  created_at: string;
}

interface AdjustmentBannerProps {
  adjustments: Adjustment[];
  onApprove: (adjustmentId: string) => void;
  onDismiss: (adjustmentId: string) => void;
}

// ---- Constants ----

const TRIGGER_ICONS: Record<string, string> = {
  underperformance: '📉',
  content_fatigue: '😴',
  format_underperformance: '🎨',
  scheduling_gap: '📅',
  objective_mismatch: '🎯',
};

const SEVERITY_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  low: { border: 'border-blue-400/30', bg: 'bg-blue-400/5', icon: 'text-blue-400' },
  medium: { border: 'border-amber-400/30', bg: 'bg-amber-400/5', icon: 'text-amber-400' },
  high: { border: 'border-red-400/30', bg: 'bg-red-400/5', icon: 'text-red-400' },
};

// ---- Component ----

export function AdjustmentBanner({ adjustments, onApprove, onDismiss }: AdjustmentBannerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pending = adjustments.filter(a => a.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      {pending.map(adj => {
        const severity = SEVERITY_STYLES[adj.severity] || SEVERITY_STYLES.medium;
        const icon = TRIGGER_ICONS[adj.trigger_type] || '⚡';
        const isExpanded = expandedId === adj.id;

        return (
          <div
            key={adj.id}
            className={`border rounded-lg ${severity.border} ${severity.bg} transition-all`}
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : adj.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-charcoal">{adj.title}</h4>
                    <span className={`text-[10px] font-bold uppercase ${severity.icon}`}>
                      {adj.severity}
                    </span>
                  </div>
                  <p className="text-xs text-stone">{adj.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={e => { e.stopPropagation(); onApprove(adj.id); }}
                  className="text-xs"
                >
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => { e.stopPropagation(); onDismiss(adj.id); }}
                  className="text-xs"
                >
                  Dismiss
                </Button>
                <svg
                  className={`w-4 h-4 text-stone/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-3 border-t border-stone/10 pt-3">
                <div className="text-xs text-stone mb-2">
                  <span className="font-medium text-charcoal">Recommendation: </span>
                  {adj.recommendation}
                </div>
                <div className="text-[10px] text-stone/50">
                  Detected {new Date(adj.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  Trigger: {adj.trigger_type.replace(/_/g, ' ')}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
