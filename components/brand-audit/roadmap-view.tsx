'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CATEGORY_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditCategory } from '@/types/database';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface OfferMatch {
  id: string;
  audit_category: BrandAuditCategory;
  priority: number;
  relevance_description: string | null;
  is_user_override: boolean;
  offer_id: string | null;
  offers?: {
    id: string;
    name: string;
    description: string | null;
    price_display: string | null;
    service_tags: string[];
  } | null;
}

interface RoadmapViewProps {
  auditId: string;
  showPricing?: boolean;
}

export function RoadmapView({ auditId, showPricing = false }: RoadmapViewProps) {
  const [matches, setMatches] = useState<OfferMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchRoadmap = async () => {
    try {
      const res = await fetch(`/api/brand-audits/${auditId}/roadmap`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoadmap(); }, [auditId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/brand-audits/${auditId}/roadmap`, { method: 'POST' });
      if (res.ok) {
        await fetchRoadmap();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate roadmap');
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-white rounded-xl h-48 border border-stone/10" />;
  }

  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center border border-stone/10">
        <SparklesIcon className="w-8 h-8 text-gold mx-auto mb-3" />
        <h3 className="font-semibold text-charcoal mb-2">No Roadmap Generated Yet</h3>
        <p className="text-sm text-stone mb-4">Generate a priority roadmap that matches audit gaps to your service offers.</p>
        <Button onClick={handleGenerate} disabled={generating} className="bg-gold hover:bg-gold/90 text-dark">
          {generating ? 'Generating...' : 'Generate Roadmap'}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-charcoal">Priority Roadmap</h3>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
          <ArrowPathIcon className="w-4 h-4 mr-1" />
          {generating ? 'Regenerating...' : 'Regenerate'}
        </Button>
      </div>

      {matches.map((match) => (
        <Card key={match.id} className="p-4 border border-stone/10">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-sm flex-shrink-0">
              {match.priority}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-charcoal text-sm">
                  {CATEGORY_LABELS[match.audit_category]}
                </h4>
                {match.is_user_override && (
                  <span className="text-xs text-stone bg-stone/10 px-2 py-0.5 rounded-full">Manually assigned</span>
                )}
              </div>
              {match.relevance_description && (
                <p className="text-sm text-stone mt-1">{match.relevance_description}</p>
              )}
              {match.offers && (
                <div className="mt-3 p-3 bg-cream-warm rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-charcoal">{match.offers.name}</span>
                      {match.offers.description && (
                        <p className="text-xs text-stone mt-0.5">{match.offers.description}</p>
                      )}
                    </div>
                    {showPricing && match.offers.price_display && (
                      <span className="text-sm font-semibold text-teal">{match.offers.price_display}</span>
                    )}
                  </div>
                  {match.offers.service_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.offers.service_tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-teal/10 text-teal rounded-full text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
