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
  QuestionMarkCircleIcon,
  XMarkIcon,
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
  const [showInfo, setShowInfo] = useState(false);

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

      {/* How Points Work */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowInfo(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal bg-teal/10 rounded-lg hover:bg-teal/20 transition-colors"
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
          How Points Work
        </button>
      </div>

      {/* Info Modal */}
      {showInfo && <HowPointsWorkModal onClose={() => setShowInfo(false)} />}

      {/* Current Quest */}
      {currentQuest && (
        <div className="bg-white rounded-xl border border-stone/10 p-5 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3 flex items-center gap-2">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Trend (simple bar chart) */}
        <div className="bg-white rounded-xl border border-stone/10 p-5 shadow-sm">
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
        <div className="bg-white rounded-xl border border-stone/10 p-5 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">Points by Category</h3>
          <div className="space-y-2.5">
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
        <div className="bg-white rounded-xl border border-stone/10 p-5 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">Recent Scores</h3>
          <div className="space-y-2">
            {scoreData.recent_scores.map((score) => (
              <div key={score.id} className="flex items-center gap-3 p-3 bg-cream-warm/30 rounded-lg">
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
        <div className="bg-white rounded-xl border border-stone/10 p-5 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-charcoal mb-3">All Quests</h3>
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
    <div className="bg-white rounded-xl border border-stone/10 p-4 shadow-sm flex items-center gap-3">
      <div className="p-2 bg-cream-warm/50 rounded-lg">{icon}</div>
      <div>
        <p className="text-[10px] text-stone uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-charcoal">{value}</p>
      </div>
    </div>
  );
}

function HowPointsWorkModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10 sticky top-0 bg-white rounded-t-xl">
          <h2 className="text-lg font-serif font-semibold text-charcoal">How Authority Points Work</h2>
          <button onClick={onClose} className="p-1 hover:bg-cream-warm rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview */}
          <div>
            <p className="text-sm text-charcoal leading-relaxed">
              Authority Points measure your media presence and PR impact. You earn points every time one of your PR opportunities reaches the <span className="font-semibold text-teal">Published</span> stage in the pipeline. The more prestigious and far-reaching the placement, the more points you earn.
            </p>
          </div>

          {/* Scoring Formula */}
          <div>
            <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">Scoring Formula</h3>
            <div className="bg-cream-warm/40 rounded-lg p-4 text-center">
              <p className="text-xs text-charcoal font-mono">
                Points = Base Points x Reach Multiplier x Engagement Multiplier + Bonuses
              </p>
            </div>
          </div>

          {/* Base Points by Category */}
          <div>
            <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">Base Points by Category</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Magazine Feature', pts: 40 },
                { label: 'TV / Video', pts: 35 },
                { label: 'Live Event', pts: 30 },
                { label: 'Award / Recognition', pts: 25 },
                { label: 'Media Placement', pts: 15 },
                { label: 'Podcast Appearance', pts: 15 },
                { label: 'Press Release', pts: 10 },
                { label: 'Thought Leadership', pts: 10 },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center px-3 py-2 bg-cream-warm/30 rounded-lg">
                  <span className="text-xs text-charcoal">{item.label}</span>
                  <span className="text-xs font-bold text-teal">{item.pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reach Multiplier */}
          <div>
            <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">Reach Multiplier</h3>
            <p className="text-xs text-stone mb-2">
              Higher-reach placements earn significantly more points.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Local', mult: '1x' },
                { label: 'Regional', mult: '1.5x' },
                { label: 'National', mult: '2.5x' },
                { label: 'International', mult: '3.5x' },
              ].map((item) => (
                <div key={item.label} className="text-center px-3 py-3 bg-cream-warm/30 rounded-lg">
                  <p className="text-xs font-bold text-charcoal">{item.mult}</p>
                  <p className="text-[10px] text-stone mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Multiplier */}
          <div>
            <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">Engagement Type</h3>
            <p className="text-xs text-stone mb-2">
              Earned media is valued at full points. Paid or sponsored placements receive 65% of the base value.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Earned', mult: '1x', desc: 'Full value' },
                { label: 'Paid', mult: '0.65x', desc: '65%' },
                { label: 'Contra', mult: '0.65x', desc: '65%' },
                { label: 'Sponsored', mult: '0.65x', desc: '65%' },
              ].map((item) => (
                <div key={item.label} className="text-center px-3 py-3 bg-cream-warm/30 rounded-lg">
                  <p className="text-xs font-bold text-charcoal">{item.mult}</p>
                  <p className="text-[10px] text-stone mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bonuses */}
          <div>
            <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">Bonus Points</h3>
            <div className="space-y-2">
              {[
                { label: 'Amplification Bonus', pct: '+25%', desc: 'Run a social media amplification campaign after your placement goes live' },
                { label: 'Round Completion Bonus', pct: '+15%', desc: 'Complete all placements in a round/batch' },
                { label: 'Consistency Bonus', pct: '+10%', desc: 'Maintain regular monthly publishing activity' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 px-3 py-2.5 bg-cream-warm/30 rounded-lg">
                  <span className="text-xs font-bold text-gold whitespace-nowrap">{item.pct}</span>
                  <div>
                    <p className="text-xs font-medium text-charcoal">{item.label}</p>
                    <p className="text-[10px] text-stone mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div>
            <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">Authority Tiers</h3>
            <p className="text-xs text-stone mb-2">
              As you accumulate points, you progress through 5 tiers. Complete quests to unlock each tier.
            </p>
            <div className="space-y-2">
              {[
                { name: 'Foundation', range: '0 - 49 pts', color: '#6b7280' },
                { name: 'Emerging', range: '50 - 149 pts', color: '#3b82f6' },
                { name: 'Rising', range: '150 - 399 pts', color: '#8b5cf6' },
                { name: 'Established', range: '400 - 799 pts', color: '#f59e0b' },
                { name: 'Authority', range: '800+ pts', color: '#d4a017' },
              ].map((tier) => (
                <div key={tier.name} className="flex items-center gap-3 px-3 py-2 bg-cream-warm/30 rounded-lg">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-xs font-semibold text-charcoal flex-1">{tier.name}</span>
                  <span className="text-xs text-stone">{tier.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example */}
          <div className="bg-teal/5 border border-teal/20 rounded-lg p-4">
            <h3 className="text-sm font-serif font-semibold text-charcoal mb-2">Example</h3>
            <p className="text-xs text-charcoal leading-relaxed">
              A <span className="font-semibold">Magazine Feature</span> (40 pts) with <span className="font-semibold">national</span> reach (2.5x) that was <span className="font-semibold">earned</span> (1x) with an <span className="font-semibold">amplification campaign</span> (+25%):
            </p>
            <p className="text-sm font-mono text-teal font-bold mt-2 text-center">
              40 x 2.5 x 1.0 = 100 + 25% bonus = 125 points
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-teal hover:bg-teal-dark rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
