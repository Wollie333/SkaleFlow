'use client';

import { Button } from '@/components/ui';
import { CheckCircleIcon, PauseCircleIcon, PlayIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approved: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface OrgData {
  id: string;
  name: string;
  slug: string;
  membership_role: string;
  subscription: {
    id: string;
    status: string;
    tier: {
      id: string;
      name: string;
      slug: string;
      monthly_credits: number;
    } | null;
  } | null;
  credits: {
    monthly_balance: number;
    topup_balance: number;
    total_balance: number;
    period_start: string;
    period_end: string;
  } | null;
}

interface UserProfileCardProps {
  user: UserData;
  organization: OrgData | null;
  onApprove: () => void;
  onPause: () => void;
  onAssignOrg: () => void;
  onRoleChange?: (role: string) => void;
  onPauseSubscription?: () => void;
  onCancelSubscription?: () => void;
  onReactivateSubscription?: () => void;
  actionLoading: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const roleBadge: Record<string, { label: string; classes: string }> = {
  super_admin: { label: 'Super Admin', classes: 'bg-purple-100 text-purple-700' },
  team_member: { label: 'Team Member', classes: 'bg-blue-500/10 text-blue-400' },
  client: { label: 'Client', classes: 'bg-teal/10 text-teal' },
};

export function UserProfileCard({
  user,
  organization,
  onApprove,
  onPause,
  onAssignOrg,
  onRoleChange,
  onPauseSubscription,
  onCancelSubscription,
  onReactivateSubscription,
  actionLoading,
}: UserProfileCardProps) {
  const badge = roleBadge[user.role] || roleBadge.client;

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-lg">
            {getInitials(user.full_name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-charcoal truncate">{user.full_name}</h3>
            <p className="text-sm text-stone truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.classes}`}>
            {badge.label}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            user.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-gold/20 text-gold'
          }`}>
            {user.approved ? 'Approved' : 'Pending'}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone">Joined</span>
            <span className="text-charcoal font-medium">{formatDate(user.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone">Last Login</span>
            <span className="text-charcoal font-medium">
              {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
            </span>
          </div>
        </div>

        {/* Role change dropdown */}
        {onRoleChange && user.role !== 'super_admin' && (
          <div className="mt-4 pt-4 border-t border-stone/10">
            <label className="text-xs font-semibold text-stone uppercase tracking-wider block mb-2">
              Role
            </label>
            <select
              value={user.role}
              onChange={(e) => onRoleChange(e.target.value)}
              disabled={actionLoading}
              className="w-full text-sm border border-stone/10 rounded-lg px-3 py-2 bg-cream-warm text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal disabled:opacity-50 cursor-pointer"
            >
              <option value="client">Client</option>
              <option value="team_member">Team Member</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        )}

        {/* Approve / Pause toggle */}
        <div className="mt-4 pt-4 border-t border-stone/10">
          {user.approved ? (
            <button
              onClick={onPause}
              disabled={actionLoading || user.role === 'super_admin'}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PauseCircleIcon className="w-4 h-4" />
              Pause Account
            </button>
          ) : (
            <Button
              onClick={onApprove}
              disabled={actionLoading}
              isLoading={actionLoading}
              className="w-full bg-teal hover:bg-teal-light text-white text-sm"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1.5" />
              Approve Account
            </Button>
          )}
        </div>
      </div>

      {/* Organization Card */}
      <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
        <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Organization</h4>
        {organization ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium text-charcoal">{organization.name}</p>
            <div className="flex justify-between">
              <span className="text-stone">Role</span>
              <span className="text-charcoal font-medium capitalize">{organization.membership_role}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-stone mb-3">No organization assigned</p>
            <button
              onClick={onAssignOrg}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:text-teal-light bg-teal/5 hover:bg-teal/10 px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create & Assign Organization
            </button>
          </div>
        )}
      </div>

      {/* Subscription Card */}
      {organization && (
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Subscription</h4>
          {organization.subscription ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-stone">Tier</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal">
                  {organization.subscription.tier?.name || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Status</span>
                <span className="text-charcoal font-medium capitalize">{organization.subscription.status}</span>
              </div>
              {organization.subscription.tier && (
                <div className="flex justify-between">
                  <span className="text-stone">Monthly Credits</span>
                  <span className="text-charcoal font-medium">
                    {organization.subscription.tier.monthly_credits.toLocaleString('en-ZA')}
                  </span>
                </div>
              )}

              {/* Subscription Quick Actions */}
              <div className="pt-3 mt-2 border-t border-stone/10 flex flex-col gap-2">
                {(organization.subscription.status === 'active' || organization.subscription.status === 'trial') && (
                  <div className="flex items-center gap-2">
                    {onPauseSubscription && (
                      <button
                        onClick={onPauseSubscription}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <PauseCircleIcon className="w-3.5 h-3.5" />
                        Pause
                      </button>
                    )}
                    {onCancelSubscription && (
                      <button
                        onClick={onCancelSubscription}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                )}
                {organization.subscription.status === 'paused' && (
                  <div className="flex items-center gap-2">
                    {onReactivateSubscription && (
                      <button
                        onClick={onReactivateSubscription}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-teal hover:text-teal-light bg-teal/5 hover:bg-teal/10 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <PlayIcon className="w-3.5 h-3.5" />
                        Reactivate
                      </button>
                    )}
                    {onCancelSubscription && (
                      <button
                        onClick={onCancelSubscription}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                )}
                {organization.subscription.status === 'cancelled' && onReactivateSubscription && (
                  <button
                    onClick={onReactivateSubscription}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-teal hover:text-teal-light bg-teal/5 hover:bg-teal/10 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <PlayIcon className="w-3.5 h-3.5" />
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone">No subscription</p>
          )}
        </div>
      )}

      {/* Credit Balance Card */}
      {organization?.credits && (
        <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5">
          <h4 className="text-xs font-semibold text-stone uppercase tracking-wider mb-3">Credit Balance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone">Monthly</span>
              <span className="text-charcoal font-medium">{organization.credits.monthly_balance.toLocaleString('en-ZA')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone">Top-up</span>
              <span className="text-charcoal font-medium">{organization.credits.topup_balance.toLocaleString('en-ZA')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone/10">
              <span className="text-charcoal font-semibold">Total</span>
              <span className="text-charcoal font-bold">{organization.credits.total_balance.toLocaleString('en-ZA')}</span>
            </div>
            {organization.credits.period_end && (
              <p className="text-xs text-stone mt-1">
                Resets {formatDate(organization.credits.period_end)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
