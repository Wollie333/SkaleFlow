'use client';

import { useEffect, useState, useCallback } from 'react';
import { TierBadge } from './tier-badge';
import { QuestCard } from './quest-card';
import type { QuestRequirement } from '@/lib/authority/types';
import { CATEGORY_CONFIG } from '@/lib/authority/constants';
import {
  TrophyIcon,
  ArrowTrendingUpIcon,
  NewspaperIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ScoreData {
  total_points: number;
  tier: { tier: number; name: string };
  placement_count: number;
  recent_scores: Array<{
    id: string;
    total_points: number;
    activity_category: string;
    description: string | null;
    scored_at: string;
    authority_pipeline_cards?: { opportunity_name: string; category: string } | null;
  }>;
  category_breakdown: Record<string, number>;
  monthly_trend: Array<{ month: string; points: number }>;
}

interface QuestData {
  quests: Array<{
    id: string;
    quest_name: string;
    tier: number;
    description: string | null;
    requirements: QuestRequirement[];
    status: string;
    progress_percentage: number;
    is_current: boolean;
    completed_at: string | null;
  }>;
  stats: {
    publishCount: number;
    totalPoints: number;
    uniqueCategories: number;
    amplificationCount: number;
    nationalPlusCount: number;
  };
  highestCompletedTier: number;
}

interface AuthorityDashboardProps {
  organizationId: string;
}

export function AuthorityDashboard({ organizationId }: AuthorityDashboardProps) {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [questData, setQuestData] = useState<QuestData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [scoreRes, questRes] = await Promise.all([
        fetch(`/api/authority/score?organizationId=${organizationId}`),
        fetch(`/api/authority/quests?organizationId=${organizationId}`),
      ]);
      if (scoreRes.ok) setScoreData(await scoreRes.json());
      if (questRes.ok) setQuestData(await questRes.json());
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-cream-warm/50 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-cream-warm/50 rounded-xl" />
          <div className="h-20 bg-cream-warm/50 rounded-xl" />
          <div className="h-20 bg-cream-warm/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="text-center py-8 text-stone text-sm">
        Unable to load authority data.
      </div>
    );
  }

  const currentQuest = questData?.quests.find(q => q.is_current);
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Top Row: Tier + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <TierBadge
            tier={scoreData.tier.tier}
            tierName={scoreData.tier.name}
            totalPoints={scoreData.total_points}
            size="md"
          />
        </div>

        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          <StatCard
            icon={<TrophyIcon className="w-5 h-5 text-gold" />}
            label="Total Points"
            value={scoreData.total_points.toLocaleString()}
          />
          <StatCard
            icon={<NewspaperIcon className="w-5 h-5 text-teal" />}
            label="Placements"
            value={String(scoreData.placement_count)}
          />
          <StatCard
            icon={<ArrowTrendingUpIcon className="w-5 h-5 text-indigo-500" />}
            label="Categories"
            value={String(Object.keys(scoreData.category_breakdown).length)}
          />
        </div>
      </div>

      {/* Current Quest */}
      {currentQuest && (
        <div>
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-2 flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-teal" />
            Current Quest
          </h3>
          <QuestCard
            questName={currentQuest.quest_name}
            tier={currentQuest.tier}
            description={currentQuest.description}
            requirements={currentQuest.requirements}
            status={currentQuest.status}
            progressPercentage={currentQuest.progress_percentage}
            isCurrent={true}
            completedAt={currentQuest.completed_at}
          />
        </div>
      )}

      {/* Two columns: Monthly Trend + Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trend (simple bar chart) */}
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">Monthly Points</h3>
          <div className="flex items-end gap-1 h-32">
            {scoreData.monthly_trend.map((m) => {
              const maxPts = Math.max(...scoreData.monthly_trend.map(t => t.points), 1);
              const height = (m.points / maxPts) * 100;
              const monthNum = parseInt(m.month.split('-')[1]) - 1;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-stone">{m.points || ''}</span>
                  <div
                    className="w-full bg-teal/80 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-[9px] text-stone">{monthLabels[monthNum]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">Points by Category</h3>
          <div className="space-y-2">
            {Object.entries(scoreData.category_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, pts]) => {
                const maxPts = Math.max(...Object.values(scoreData.category_breakdown), 1);
                const label = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label || cat;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-charcoal">{label}</span>
                      <span className="text-stone">{pts} pts</span>
                    </div>
                    <div className="h-1.5 bg-cream-warm rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full"
                        style={{ width: `${(pts / maxPts) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            }
            {Object.keys(scoreData.category_breakdown).length === 0 && (
              <p className="text-xs text-stone text-center py-4">No scores yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {scoreData.recent_scores.length > 0 && (
        <div className="bg-white rounded-xl border border-stone/10 p-4">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">Recent Scores</h3>
          <div className="space-y-2">
            {scoreData.recent_scores.map((score) => (
              <div key={score.id} className="flex items-center gap-3 p-2 bg-cream-warm/30 rounded-lg">
                <span className="text-sm font-bold text-teal">+{score.total_points}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-charcoal truncate">
                    {score.authority_pipeline_cards?.opportunity_name || score.description || 'Score'}
                  </p>
                  <p className="text-[10px] text-stone">{score.description}</p>
                </div>
                <span className="text-[10px] text-stone whitespace-nowrap">
                  {new Date(score.scored_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Quests */}
      {questData && questData.quests.length > 1 && (
        <div>
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">All Quests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questData.quests.map((quest) => (
              <QuestCard
                key={quest.id}
                questName={quest.quest_name}
                tier={quest.tier}
                description={quest.description}
                requirements={quest.requirements}
                status={quest.status}
                progressPercentage={quest.progress_percentage}
                isCurrent={quest.is_current}
                completedAt={quest.completed_at}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone/10 p-4 flex items-center gap-3">
      <div className="p-2 bg-cream-warm/50 rounded-lg">{icon}</div>
      <div>
        <p className="text-[10px] text-stone uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-charcoal">{value}</p>
      </div>
    </div>
  );
}
