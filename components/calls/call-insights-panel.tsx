'use client';

import { useState } from 'react';

interface StrategicInsight {
  category: string;
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  actionable_step: string;
}

interface BrandInsight {
  id: string;
  insight_type: string;
  content: string;
  brand_engine_field: string | null;
  status: string;
}

interface CallInsightsPanelProps {
  strategicInsights: {
    strategic_summary: string;
    action_steps: string[];
    insights: StrategicInsight[];
  } | null;
  brandInsights: BrandInsight[];
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-gold/10 text-gold border-gold/20',
  low: 'bg-teal/10 text-teal border-teal/20',
};

export function CallInsightsPanel({ strategicInsights, brandInsights }: CallInsightsPanelProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [brandExpanded, setBrandExpanded] = useState(false);

  function toggleStep(index: number) {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  if (!strategicInsights) {
    return (
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-8 text-center">
        <p className="text-stone text-sm">Strategic insights are being generated...</p>
        <button
          onClick={() => window.location.reload()}
          className="text-teal text-sm mt-2 hover:underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategic Summary */}
      {strategicInsights.strategic_summary && (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Strategic Summary</h3>
          <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
            {strategicInsights.strategic_summary}
          </p>
        </div>
      )}

      {/* Action Steps */}
      {strategicInsights.action_steps?.length > 0 && (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Action Steps</h3>
          <ul className="space-y-2">
            {strategicInsights.action_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <button
                  onClick={() => toggleStep(i)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    checkedSteps.has(i)
                      ? 'bg-teal border-teal text-white'
                      : 'border-stone/30 hover:border-teal'
                  }`}
                >
                  {checkedSteps.has(i) && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span
                  className={`text-sm text-charcoal ${checkedSteps.has(i) ? 'line-through opacity-60' : ''}`}
                >
                  {step}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Insight Cards */}
      {strategicInsights.insights?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal mb-3">Insights</h3>
          <div className="space-y-3">
            {strategicInsights.insights.map((insight, i) => {
              const priorityStyle = PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.low;
              return (
                <div key={i} className="bg-cream-warm rounded-xl border border-stone/10 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-stone capitalize bg-white/60 px-2 py-0.5 rounded">
                      {insight.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${priorityStyle}`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-charcoal">{insight.title}</p>
                  <p className="text-sm text-stone leading-relaxed">{insight.detail}</p>
                  {insight.actionable_step && (
                    <div className="bg-teal/10 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-teal mb-0.5">Actionable Step</p>
                      <p className="text-sm text-charcoal">{insight.actionable_step}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Brand Insights (collapsible) */}
      {brandInsights.length > 0 && (
        <div className="bg-cream-warm rounded-xl border border-stone/10">
          <button
            onClick={() => setBrandExpanded(prev => !prev)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <h3 className="text-sm font-semibold text-charcoal">
              Brand Insights ({brandInsights.length})
            </h3>
            <svg
              className={`w-4 h-4 text-stone transition-transform ${brandExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {brandExpanded && (
            <div className="px-5 pb-5 space-y-3 border-t border-stone/10 pt-4">
              {brandInsights.map(bi => (
                <div key={bi.id} className="flex items-start gap-3">
                  <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded capitalize flex-shrink-0 mt-0.5">
                    {bi.insight_type.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">{bi.content}</p>
                    {bi.brand_engine_field && (
                      <span className="text-xs text-stone mt-1 block">
                        Field: {bi.brand_engine_field}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
