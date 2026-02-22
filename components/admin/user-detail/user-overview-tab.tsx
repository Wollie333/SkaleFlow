'use client';

import {
  DocumentTextIcon,
  CpuChipIcon,
  SparklesIcon,
  CheckBadgeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  approved: number;
  pending_review: number;
}

interface BrandPhase {
  phase_number: number;
  phase_name: string;
  status: string;
}

interface FeatureUsage {
  feature: string;
  label: string;
  credits_charged: number;
  request_count: number;
}

interface UserOverviewTabProps {
  contentStats: ContentStats;
  brandProgress: BrandPhase[];
  creditsByFeature: FeatureUsage[];
  subscriptionStatus: string | null;
  totalCreditsUsed: number;
  recentContent: Array<{
    id: string;
    title: string;
    status: string;
    platform: string;
    updated_at: string;
  }>;
  teamMemberCount?: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  });
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500',
  active: 'bg-teal',
  in_progress: 'bg-teal',
  not_started: 'bg-stone/20',
};

const contentStatusColors: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-600',
  draft: 'bg-stone/10 text-stone',
  scheduled: 'bg-blue-50 text-blue-600',
  approved: 'bg-teal/10 text-teal',
  pending_review: 'bg-amber-50 text-amber-600',
};

export function UserOverviewTab({
  contentStats,
  brandProgress,
  creditsByFeature,
  subscriptionStatus,
  totalCreditsUsed,
  recentContent,
  teamMemberCount,
}: UserOverviewTabProps) {
  const completedPhases = brandProgress.filter(p => p.status === 'completed').length;
  const brandPercent = Math.round((completedPhases / brandProgress.length) * 100);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-teal" />
            <p className="text-xs font-semibold text-stone uppercase tracking-wider">Content Items</p>
          </div>
          <p className="text-2xl font-bold text-charcoal">{contentStats.total}</p>
          <p className="text-sm text-stone mt-1">
            {contentStats.published} published, {contentStats.draft} drafts
          </p>
        </div>

        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <CpuChipIcon className="w-5 h-5 text-teal" />
            <p className="text-xs font-semibold text-stone uppercase tracking-wider">Credits Used</p>
          </div>
          <p className="text-2xl font-bold text-charcoal">{(totalCreditsUsed ?? 0).toLocaleString('en-ZA')}</p>
          <p className="text-sm text-stone mt-1">
            {creditsByFeature.length} feature{creditsByFeature.length !== 1 ? 's' : ''} used
          </p>
        </div>

        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5 text-teal" />
            <p className="text-xs font-semibold text-stone uppercase tracking-wider">Brand Progress</p>
          </div>
          <p className="text-2xl font-bold text-charcoal">{brandPercent}%</p>
          <p className="text-sm text-stone mt-1">
            {completedPhases}/{brandProgress.length} phases complete
          </p>
        </div>

        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckBadgeIcon className="w-5 h-5 text-teal" />
            <p className="text-xs font-semibold text-stone uppercase tracking-wider">Subscription</p>
          </div>
          <p className="text-2xl font-bold text-charcoal capitalize">{subscriptionStatus || 'None'}</p>
        </div>

        {teamMemberCount !== undefined && (
          <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="w-5 h-5 text-teal" />
              <p className="text-xs font-semibold text-stone uppercase tracking-wider">Team Members</p>
            </div>
            <p className="text-2xl font-bold text-charcoal">{teamMemberCount}</p>
          </div>
        )}
      </div>

      {/* Brand Progress */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
        <h3 className="font-serif text-lg font-bold text-charcoal mb-4">Brand Progress</h3>
        <div className="space-y-2">
          {brandProgress.map((phase) => (
            <div key={phase.phase_number} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColors[phase.status] || statusColors.not_started}`} />
              <span className="text-sm text-stone w-6">{phase.phase_number}.</span>
              <span className="text-sm text-charcoal flex-1">{phase.phase_name}</span>
              <span className={`text-xs font-medium capitalize ${
                phase.status === 'completed' ? 'text-emerald-600' :
                phase.status === 'active' || phase.status === 'in_progress' ? 'text-teal' :
                'text-stone'
              }`}>
                {phase.status === 'not_started' ? 'Not started' : phase.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Content */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stone/10">
          <h3 className="font-serif text-lg font-bold text-charcoal">Recent Content</h3>
        </div>
        {recentContent.length === 0 ? (
          <div className="p-8 text-center text-stone text-sm">No content created yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone/10">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Platform</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentContent.slice(0, 5).map((item) => (
                <tr key={item.id} className="border-b border-stone/10 last:border-0">
                  <td className="px-5 py-3 text-sm text-charcoal font-medium truncate max-w-[200px]">
                    {item.title || 'Untitled'}
                  </td>
                  <td className="px-5 py-3 text-sm text-stone capitalize">{item.platform || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      contentStatusColors[item.status] || 'bg-stone/10 text-stone'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-stone text-right">{formatDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
