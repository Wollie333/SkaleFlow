'use client';

import { useState, useEffect } from 'react';

interface Insight {
  id: string;
  insight_type: string;
  content: string;
  brand_engine_field: string | null;
  status: string;
  created_at: string;
  calls: { title: string; room_code: string } | null;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => { loadInsights(); }, [filter]);

  async function loadInsights() {
    setLoading(true);
    const res = await fetch(`/api/calls/insights?status=${filter}`);
    const data = await res.json();
    if (Array.isArray(data)) setInsights(data);
    setLoading(false);
  }

  async function handleAction(insightId: string, action: 'accept' | 'dismiss') {
    await fetch('/api/calls/insights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insightId, action }),
    });
    setInsights(prev => prev.filter(i => i.id !== insightId));
  }

  const insightTypeLabels: Record<string, string> = {
    pain_point: 'Pain Point', language_pattern: 'Language Pattern', objection: 'Objection',
    budget_signal: 'Budget Signal', need: 'Need', competitor_mention: 'Competitor', value_perception: 'Value Perception',
  };

  const insightTypeColors: Record<string, string> = {
    pain_point: 'bg-red-100 text-red-700', language_pattern: 'bg-blue-100 text-blue-700', objection: 'bg-orange-100 text-orange-700',
    budget_signal: 'bg-green-100 text-green-700', need: 'bg-purple-100 text-purple-700', competitor_mention: 'bg-yellow-100 text-yellow-700', value_perception: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-charcoal">Brand Insights from Calls</h1>
        <p className="text-sm text-stone mt-1">AI-extracted market intelligence from your sales conversations. Accept insights to feed them into your Brand Engine.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['pending', 'accepted', 'dismissed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === s ? 'bg-teal text-white' : 'bg-cream text-charcoal hover:bg-stone/10'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-stone text-sm animate-pulse">Loading insights...</div>
      ) : insights.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone/10">
          <p className="text-stone text-sm">No {filter} insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map(insight => (
            <div key={insight.id} className="bg-white rounded-xl border border-stone/10 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${insightTypeColors[insight.insight_type] || 'bg-gray-100 text-gray-700'}`}>
                      {insightTypeLabels[insight.insight_type] || insight.insight_type}
                    </span>
                    {insight.calls && (
                      <span className="text-xs text-stone">from: {insight.calls.title}</span>
                    )}
                    {insight.brand_engine_field && (
                      <span className="text-xs text-teal">&rarr; {insight.brand_engine_field}</span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal">{insight.content}</p>
                </div>
                {filter === 'pending' && (
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleAction(insight.id, 'accept')}
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(insight.id, 'dismiss')}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
