'use client';

import { useState, useEffect, use } from 'react';
import { CallSummary } from '@/components/calls/call-summary';
import { ActionItemsList } from '@/components/calls/action-items-list';
import { FollowUpEditor } from '@/components/calls/follow-up-editor';
import { CallScoreCard } from '@/components/calls/call-score-card';

interface SummaryData {
  call: {
    id: string;
    title: string;
    call_type: string;
    actual_start: string | null;
    actual_end: string | null;
    room_code: string;
    crm_contact_id: string | null;
  };
  summary: {
    id: string;
    summary_text: string | null;
    key_points: string[];
    decisions_made: string[];
    objections_raised: Array<{ objection: string; response: string; resolved: boolean }>;
    sentiment_arc: Array<{ phase: string; sentiment: string }>;
    next_steps: Array<{ action: string; owner: string; deadline: string }>;
    deal_stage_recommendation: string | null;
    call_score: Record<string, number> | null;
    follow_up_email_draft: string | null;
  } | null;
  actionItems: Array<{
    id: string;
    description: string;
    assigned_to: string | null;
    due_date: string | null;
    status: string;
  }>;
  insights: Array<{
    id: string;
    insight_type: string;
    content: string;
    brand_engine_field: string | null;
    status: string;
  }>;
}

export default function PostCallSummaryPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'followup' | 'score' | 'insights'>('summary');

  useEffect(() => {
    fetch(`/api/calls/${roomCode}/summary`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roomCode]);

  if (loading) return <div className="p-8 text-stone animate-pulse">Loading summary...</div>;
  if (!data?.call) return <div className="p-8 text-stone">Call not found</div>;

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'actions', label: `Actions (${data.actionItems.length})` },
    { id: 'followup', label: 'Follow-up' },
    { id: 'score', label: 'Score' },
    { id: 'insights', label: `Insights (${data.insights.length})` },
  ];

  const duration = data.call.actual_start && data.call.actual_end
    ? Math.round((new Date(data.call.actual_end).getTime() - new Date(data.call.actual_start).getTime()) / 60000)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-charcoal">{data.call.title}</h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-stone">
          <span className="capitalize">{data.call.call_type.replace('_', ' ')}</span>
          {data.call.actual_start && (
            <span>{new Date(data.call.actual_start).toLocaleDateString()}</span>
          )}
          {duration && <span>{duration} min</span>}
          {data.summary?.deal_stage_recommendation && (
            <span className="px-2 py-0.5 bg-teal/10 text-teal rounded-full text-xs font-medium">
              Recommended: {data.summary.deal_stage_recommendation}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone/10 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && data.summary && (
        <CallSummary summary={data.summary} />
      )}
      {activeTab === 'actions' && (
        <ActionItemsList items={data.actionItems} roomCode={roomCode} />
      )}
      {activeTab === 'followup' && data.summary && (
        <FollowUpEditor
          draft={data.summary.follow_up_email_draft}
          roomCode={roomCode}
        />
      )}
      {activeTab === 'score' && data.summary?.call_score && (
        <CallScoreCard score={data.summary.call_score} />
      )}
      {activeTab === 'insights' && (
        <div className="space-y-3">
          {data.insights.length === 0 ? (
            <p className="text-stone text-sm text-center py-8">No brand insights extracted from this call.</p>
          ) : (
            data.insights.map(insight => (
              <div key={insight.id} className="bg-white rounded-xl border border-stone/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-gold/10 text-gold rounded-full capitalize">
                    {insight.insight_type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    insight.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    insight.status === 'dismissed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {insight.status}
                  </span>
                  {insight.brand_engine_field && (
                    <span className="text-xs text-stone">{'\u2192'} {insight.brand_engine_field}</span>
                  )}
                </div>
                <p className="text-sm text-charcoal">{insight.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {!data.summary && activeTab === 'summary' && (
        <div className="text-center py-12 bg-white rounded-xl border border-stone/10">
          <p className="text-stone text-sm">Summary is still being generated...</p>
          <button
            onClick={() => window.location.reload()}
            className="text-teal text-sm hover:underline mt-2"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
