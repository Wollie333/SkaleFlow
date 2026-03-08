'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CONTENT_TYPES, ALL_CONTENT_TYPE_IDS, type ContentTypeId } from '@/config/content-types';

// ---- Types ----

interface ContentTypePerformance {
  type_id: number;
  type_name: string;
  total_posts: number;
  avg_engagement_rate: number;
  avg_impressions: number;
  avg_voice_score: number;
  winners: number;
  best_format: string;
}

interface PlatformPerformance {
  platform: string;
  total_posts: number;
  avg_engagement_rate: number;
  total_impressions: number;
  top_content_type: number;
}

interface CampaignReportData {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  date_range: { start: string; end: string };
  total_posts: number;
  published_posts: number;
  avg_engagement_rate: number;
  total_impressions: number;
  total_winners: number;
  content_type_performance: ContentTypePerformance[];
  platform_performance: PlatformPerformance[];
  top_posts: Array<{ id: string; topic: string; engagement_rate: number; impressions: number }>;
  recommendations: string[];
  generated_at: string;
}

interface CampaignReportProps {
  campaignId: string;
  onGenerateReport: () => void;
  onExport: () => void;
}

// ---- Constants ----

const TYPE_COLORS = ['', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6'];

// ---- Component ----

export function CampaignReport({ campaignId, onGenerateReport, onExport }: CampaignReportProps) {
  const [report, setReport] = useState<CampaignReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [campaignId]);

  async function fetchReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/campaigns/${campaignId}/report`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report || null);
      } else {
        setReport(null);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-stone/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-stone text-body-md mb-4">
            No report available yet. Generate a report to see campaign performance insights.
          </p>
          <Button onClick={onGenerateReport}>Generate Report</Button>
        </CardContent>
      </Card>
    );
  }

  const maxEngagement = Math.max(...report.content_type_performance.map(p => p.avg_engagement_rate), 0.01);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-lg text-charcoal">Campaign Report</h2>
          <p className="text-xs text-stone mt-1">
            {report.campaign_name} · Generated {new Date(report.generated_at).toLocaleDateString('en-ZA')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onGenerateReport}>Refresh</Button>
          <Button size="sm" onClick={onExport}>Export</Button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Posts" value={report.total_posts.toString()} />
        <StatCard label="Published" value={report.published_posts.toString()} />
        <StatCard
          label="Avg Engagement"
          value={`${(report.avg_engagement_rate * 100).toFixed(1)}%`}
          highlight
        />
        <StatCard label="Impressions" value={formatNumber(report.total_impressions)} />
        <StatCard label="Winners" value={report.total_winners.toString()} highlight />
      </div>

      {/* Content Type Performance */}
      <Card>
        <CardContent>
          <h3 className="text-heading-sm text-charcoal mb-4">Content Type Performance</h3>
          <div className="space-y-3">
            {report.content_type_performance
              .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)
              .map(perf => {
                const ct = CONTENT_TYPES[perf.type_id as ContentTypeId];
                const barWidth = (perf.avg_engagement_rate / maxEngagement) * 100;

                return (
                  <div key={perf.type_id} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[perf.type_id] || '#888' }}
                    >
                      T{perf.type_id}
                    </div>
                    <span className="text-xs text-charcoal w-20 truncate">
                      {ct?.shortName || `Type ${perf.type_id}`}
                    </span>
                    <div className="flex-1 h-5 bg-stone/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: TYPE_COLORS[perf.type_id] || '#888',
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <div className="text-xs text-stone w-16 text-right">
                      {(perf.avg_engagement_rate * 100).toFixed(1)}% ER
                    </div>
                    <div className="text-xs text-stone/50 w-16 text-right">
                      {perf.total_posts} posts
                    </div>
                    {perf.winners > 0 && (
                      <span className="text-[10px] text-gold font-bold">{perf.winners}W</span>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Performance */}
      <Card>
        <CardContent>
          <h3 className="text-heading-sm text-charcoal mb-4">Platform Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.platform_performance.map(plat => (
              <div key={plat.platform} className="p-3 bg-stone/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-charcoal capitalize">{plat.platform}</span>
                  <span className="text-xs text-stone">{plat.total_posts} posts</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone">Engagement Rate</span>
                    <span className="text-charcoal font-medium">
                      {(plat.avg_engagement_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone">Impressions</span>
                    <span className="text-charcoal font-medium">
                      {formatNumber(plat.total_impressions)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone">Top Type</span>
                    <span className="text-charcoal font-medium">
                      T{plat.top_content_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      {report.top_posts.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="text-heading-sm text-charcoal mb-4">Top Posts</h3>
            <div className="space-y-2">
              {report.top_posts.map((post, idx) => (
                <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone/5">
                  <span className="text-xs text-teal font-bold w-5">#{idx + 1}</span>
                  <span className="text-sm text-charcoal flex-1 truncate">{post.topic}</span>
                  <span className="text-xs text-stone">
                    {(post.engagement_rate * 100).toFixed(1)}% ER
                  </span>
                  <span className="text-xs text-stone/50">
                    {formatNumber(post.impressions)} imp
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {report.recommendations.length > 0 && (
        <Card className="border-teal/20 bg-teal/5">
          <CardContent>
            <h3 className="text-heading-sm text-teal mb-3">AI Recommendations</h3>
            <ul className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal text-xs mt-0.5">→</span>
                  <span className="text-sm text-charcoal">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Sub-components ----

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-3 bg-cream-warm border border-stone/10 rounded-lg">
      <div className="text-[10px] text-stone uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${highlight ? 'text-teal' : 'text-charcoal'}`}>
        {value}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
