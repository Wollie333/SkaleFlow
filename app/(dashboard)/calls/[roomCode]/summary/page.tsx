'use client';

import { useState, useEffect, use } from 'react';
import { CallSummary } from '@/components/calls/call-summary';
import { ActionItemsList } from '@/components/calls/action-items-list';
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
    recording_url: string | null;
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
  const [activeTab, setActiveTab] = useState<'summary' | 'recording' | 'actions' | 'score' | 'insights'>('summary');

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
    { id: 'recording', label: 'Recording' },
    { id: 'actions', label: `Actions (${data.actionItems.length})` },
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
      <div className="mb-4 flex gap-4 border-b border-stone/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
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
      {activeTab === 'recording' && (
        <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
          {data.call.recording_url ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-sm font-semibold text-charcoal">Call Recording</h3>
              </div>
              <video
                src={data.call.recording_url}
                controls
                className="w-full rounded-lg bg-black"
                preload="metadata"
              >
                Your browser does not support the video element.
              </video>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={data.call.recording_url}
                  download={`${data.call.title || 'recording'}.webm`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Recording
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-stone/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-stone text-sm">No recording available for this call.</p>
              <p className="text-stone/60 text-xs mt-1">Recording must be started during the call to be saved here.</p>
            </div>
          )}
        </div>
      )}
      {activeTab === 'actions' && (
        <ActionItemsList items={data.actionItems} roomCode={roomCode} />
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
              <div key={insight.id} className="bg-cream-warm rounded-xl border border-stone/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-gold/10 text-gold rounded-full capitalize">
                    {insight.insight_type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    insight.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    insight.status === 'dismissed' ? 'bg-red-100 text-red-700' :
                    'bg-cream text-charcoal'
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
        <div className="text-center py-12 bg-cream-warm rounded-xl border border-stone/10">
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
