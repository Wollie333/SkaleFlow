'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_OBJECTIVES, type CampaignObjectiveId } from '@/config/campaign-objectives';

// ---- Types ----

interface SequenceRecommendation {
  nextObjective: CampaignObjectiveId;
  reasoning: string;
  sequence: CampaignObjectiveId[];
}

interface SequenceRecommendationCardProps {
  organizationId: string;
  onStartCampaign: (objective: CampaignObjectiveId) => void;
}

// ---- Constants ----

const CATEGORY_COLORS: Record<string, string> = {
  growth: 'bg-green-500',
  revenue: 'bg-gold',
  launch: 'bg-blue-400',
  brand: 'bg-purple-400',
  community: 'bg-teal',
};

// ---- Component ----

export function SequenceRecommendationCard({ organizationId, onStartCampaign }: SequenceRecommendationCardProps) {
  const [recommendation, setRecommendation] = useState<SequenceRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendation();
  }, [organizationId]);

  async function fetchRecommendation() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/campaigns/sequence-recommendation?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data.recommendation || null);
      } else {
        setRecommendation(null);
      }
    } catch (err) {
      console.error('Failed to fetch recommendation:', err);
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="h-24 animate-pulse bg-stone/5 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) return null;

  const nextConfig = CAMPAIGN_OBJECTIVES[recommendation.nextObjective];
  const categoryColor = CATEGORY_COLORS[nextConfig?.category || 'growth'] || 'bg-stone';

  return (
    <Card className="border-teal/20 bg-gradient-to-r from-teal/5 to-transparent">
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-teal uppercase tracking-wider">
                Recommended Next
              </span>
              <div className={`w-2 h-2 rounded-full ${categoryColor}`} />
            </div>

            <h3 className="text-heading-sm text-charcoal mb-1">
              {nextConfig?.name || recommendation.nextObjective}
            </h3>
            <p className="text-sm text-stone mb-3">
              {recommendation.reasoning}
            </p>

            {/* Sequence visualization */}
            <div className="flex items-center gap-2">
              {recommendation.sequence.map((objId, idx) => {
                const config = CAMPAIGN_OBJECTIVES[objId];
                const catColor = CATEGORY_COLORS[config?.category || 'growth'] || 'bg-stone';
                return (
                  <div key={objId} className="flex items-center gap-2">
                    {idx > 0 && (
                      <svg className="w-3 h-3 text-stone/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                      idx === 0 ? 'bg-teal/10 border border-teal/20' : 'bg-stone/5'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${catColor}`} />
                      <span className={`text-xs ${idx === 0 ? 'text-teal font-medium' : 'text-stone'}`}>
                        {config?.name || objId}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            onClick={() => onStartCampaign(recommendation.nextObjective)}
            className="ml-4 flex-shrink-0"
          >
            Start Campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
