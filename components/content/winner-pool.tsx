'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';

// ---- Types ----

interface Winner {
  id: string;
  post_id: string;
  campaign_id: string;
  campaign_name: string;
  content_type: number;
  platform: string;
  format: string;
  topic: string;
  hook: string;
  category: string;
  metric_value: number;
  baseline_value: number;
  multiplier: number;
  last_recycled_at: string | null;
  recycle_count: number;
  created_at: string;
}

interface WinnerPoolProps {
  organizationId: string;
  onRecycle: (winnerId: string) => void;
  onViewPost: (postId: string, campaignId: string) => void;
}

// ---- Constants ----

const WINNER_CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  awareness: { label: 'Awareness', icon: '👁', color: 'text-blue-400' },
  engagement: { label: 'Engagement', icon: '💬', color: 'text-green-400' },
  traffic: { label: 'Traffic', icon: '🔗', color: 'text-purple-400' },
  conversion: { label: 'Conversion', icon: '💰', color: 'text-gold' },
  viral: { label: 'Viral', icon: '🚀', color: 'text-red-400' },
};

const TYPE_COLORS = ['', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6'];

// ---- Component ----

export function WinnerPool({ organizationId, onRecycle, onViewPost }: WinnerPoolProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    fetchWinners();
  }, [organizationId]);

  async function fetchWinners() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/winners?organizationId=${organizationId}`);
      const data = await res.json();
      setWinners(data.winners || []);
    } catch (err) {
      console.error('Failed to fetch winners:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = winners.filter(w => {
    if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
    if (platformFilter !== 'all' && w.platform !== platformFilter) return false;
    return true;
  });

  const platforms = Array.from(new Set(winners.map(w => w.platform)));
  const categoryStats: Record<string, number> = {};
  for (const w of winners) {
    categoryStats[w.category] = (categoryStats[w.category] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-heading-lg text-charcoal">Winner Pool</h2>
        <p className="text-body-md text-stone mt-1">
          Top-performing content across all campaigns. Recycle winners for fresh engagement.
        </p>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(WINNER_CATEGORIES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
            className={`p-3 rounded-lg border text-center transition-all ${
              categoryFilter === key
                ? 'border-teal bg-teal/5'
                : 'border-stone/10 bg-white hover:border-stone/20'
            }`}
          >
            <div className="text-lg mb-1">{config.icon}</div>
            <div className="text-xs font-medium text-charcoal">{config.label}</div>
            <div className={`text-lg font-bold ${config.color}`}>
              {categoryStats[key] || 0}
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setPlatformFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            platformFilter === 'all' ? 'bg-teal text-cream' : 'bg-stone/5 text-stone hover:bg-stone/10'
          }`}
        >
          All Platforms
        </button>
        {platforms.map(p => (
          <button
            key={p}
            onClick={() => setPlatformFilter(platformFilter === p ? 'all' : p)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors capitalize ${
              platformFilter === p ? 'bg-teal text-cream' : 'bg-stone/5 text-stone hover:bg-stone/10'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Winner cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-stone/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-stone text-body-md">
              {winners.length === 0
                ? 'No winners detected yet. Published content will be analyzed automatically.'
                : 'No winners match the current filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(winner => {
            const catConfig = WINNER_CATEGORIES[winner.category] || WINNER_CATEGORIES.engagement;
            const ct = CONTENT_TYPES[winner.content_type as ContentTypeId];
            const canRecycle = !winner.last_recycled_at ||
              (Date.now() - new Date(winner.last_recycled_at).getTime()) > 180 * 24 * 60 * 60 * 1000;

            return (
              <Card key={winner.id} className="relative">
                <CardContent>
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{catConfig.icon}</span>
                      <span className={`text-xs font-medium ${catConfig.color}`}>
                        {catConfig.label}
                      </span>
                    </div>
                    <span className="text-xs text-gold font-bold">
                      {winner.multiplier.toFixed(1)}× baseline
                    </span>
                  </div>

                  {/* Content type + platform */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: TYPE_COLORS[winner.content_type] || '#888' }}
                    >
                      T{winner.content_type}
                    </div>
                    <span className="text-xs text-stone capitalize">{winner.platform} · {winner.format}</span>
                  </div>

                  {/* Topic & hook */}
                  <h3 className="text-sm font-medium text-charcoal mb-1 line-clamp-1">
                    {winner.topic}
                  </h3>
                  <p className="text-xs text-stone line-clamp-2 mb-3">
                    {winner.hook}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-stone/60 mb-3">
                    <span>From: {winner.campaign_name}</span>
                    {winner.recycle_count > 0 && (
                      <span>Recycled {winner.recycle_count}×</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onViewPost(winner.post_id, winner.campaign_id)}
                    >
                      View Post
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onRecycle(winner.id)}
                      disabled={!canRecycle}
                    >
                      {canRecycle ? 'Recycle' : 'Cooldown'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
