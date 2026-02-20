'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ScoreGauge } from '@/components/brand-audit/score-gauge';
import { CategoryCard } from '@/components/brand-audit/category-card';
import { TrafficLight } from '@/components/brand-audit/traffic-light';
import { CATEGORY_ORDER } from '@/lib/brand-audit/types';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';

interface SharedReport {
  audit: {
    overall_score: number;
    overall_rating: string;
    executive_summary: string;
    created_at: string;
  };
  contact: { first_name: string; last_name: string } | null;
  scores: Array<{
    category: string;
    score: number;
    rating: string;
    analysis: string | null;
    key_finding: string | null;
    actionable_insight: string | null;
  }>;
  org: { name: string } | null;
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;
  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/brand-audits/shared/${token}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'Report not found or expired' : 'Failed to load report');
          return;
        }
        const data = await res.json();
        setReport(data);
      } catch {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-warm flex items-center justify-center">
        <div className="animate-pulse text-stone">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-cream-warm flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-charcoal mb-2">Report Unavailable</h1>
          <p className="text-stone">{error || 'This report could not be found.'}</p>
        </div>
      </div>
    );
  }

  const sortedScores = CATEGORY_ORDER
    .map((cat) => report.scores.find((s) => s.category === cat))
    .filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <div className="min-h-screen bg-cream-warm">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-dark text-white rounded-xl p-8 mb-6">
          <h1 className="text-2xl font-bold mb-2">Brand Audit Report</h1>
          {report.contact && (
            <p className="text-gold">
              {report.contact.first_name} {report.contact.last_name}
            </p>
          )}
          <p className="text-sm text-white/60 mt-2">
            {new Date(report.audit.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
            {report.org && ` · Prepared by ${report.org.name}`}
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-xl p-8 mb-6 flex items-center gap-8">
          <div className="relative">
            <ScoreGauge
              score={report.audit.overall_score}
              rating={report.audit.overall_rating}
              size={140}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-charcoal mb-2">Overall Brand Health</h2>
            <TrafficLight ratings={sortedScores.map((s) => ({ category: s.category, rating: s.rating }))} />
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-charcoal mb-3">Executive Summary</h3>
          <div className="text-sm text-charcoal/80 whitespace-pre-line leading-relaxed">
            {report.audit.executive_summary}
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {sortedScores.map((score) => (
            <CategoryCard
              key={score.category}
              category={score.category as BrandAuditCategory}
              score={score.score}
              rating={score.rating as BrandAuditRating}
              analysis={score.analysis}
              keyFinding={score.key_finding}
              actionableInsight={score.actionable_insight}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-stone py-4">
          Powered by SkaleFlow Brand Audit Engine
        </div>
      </div>
    </div>
  );
}
