'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Button } from '@/components/ui';
import { UserCircleIcon, ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserProfileCard } from '@/components/admin/user-detail/user-profile-card';
import { UserOverviewTab } from '@/components/admin/user-detail/user-overview-tab';
import { UserActivityTimeline } from '@/components/admin/user-detail/user-activity-timeline';
import { UserCreditsTab } from '@/components/admin/user-detail/user-credits-tab';
import { UserTeamTab } from '@/components/admin/user-detail/user-team-tab';
import { UserBillingTab } from '@/components/admin/user-detail/user-billing-tab';

type Tab = 'overview' | 'team' | 'billing' | 'activity' | 'credits';

interface UserDetail {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    approved: boolean;
    created_at: string;
    last_login_at: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    membership_role: string;
    subscription: {
      id: string;
      status: string;
      tier_id: string;
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
  } | null;
  creditsByFeature: Array<{
    feature: string;
    label: string;
    credits_charged: number;
    request_count: number;
  }>;
  contentStats: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    approved: number;
    pending_review: number;
  };
  brandProgress: Array<{
    phase_number: number;
    phase_name: string;
    status: string;
  }>;
  activity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  teamMembers: Array<{
    id: string;
    role: string;
    team_role: string | null;
    joined_at: string;
    user_id: string;
    users: {
      id: string;
      email: string;
      full_name: string;
      last_login_at: string | null;
    } | null;
  }>;
  pendingInvitations: Array<{
    id: string;
    email: string;
    status: string;
    created_at: string;
    expires_at: string;
    email_status: string;
    email_sent_at: string | null;
    email_error: string | null;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    type: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    currency: string;
    created_at: string;
  }>;
}

interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const [data, setData] = useState<UserDetail | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [tierLoading, setTierLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Org assignment popup
  const [showOrgPopup, setShowOrgPopup] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [detailRes, tiersRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch('/api/admin/users'),
      ]);

      if (!detailRes.ok) {
        const err = await detailRes.json();
        setError(err.error || 'Failed to load user');
        return;
      }

      const detail = await detailRes.json();
      setData(detail);

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.tiers || []);
      }
    } catch {
      setError('Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam && ['overview', 'team', 'billing', 'activity', 'credits'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const queryString = params.toString();
    router.push(queryString ? `/admin/users/${userId}?${queryString}` : `/admin/users/${userId}`, { scroll: false });
  };

  const handleAction = async (body: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Action failed');
        return;
      }

      // If deleted, go back
      if (body.action === 'delete') {
        router.push('/admin/users');
        return;
      }

      await fetchData();
    } catch {
      setError('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTierChange = async (tierId: string) => {
    setTierLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: tierId || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to update tier');
        return;
      }

      await fetchData();
    } catch {
      setError('Failed to update tier');
    } finally {
      setTierLoading(false);
    }
  };

  const handleAssignOrg = async () => {
    if (!orgName.trim()) return;
    setOrgLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_org', orgName: orgName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to assign organization');
        return;
      }

      setShowOrgPopup(false);
      setOrgName('');
      await fetchData();
    } catch {
      setError('Failed to assign organization');
    } finally {
      setOrgLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-stone">Loading user details...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <button
            onClick={() => router.push('/admin/users')}
            className="ml-3 underline hover:no-underline"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, organization, creditsByFeature, contentStats, brandProgress, activity, teamMembers, pendingInvitations, invoices } = data;
  const currentTierId = organization?.subscription?.tier?.id || '';

  // Extract recent content items from activity for the overview tab
  const recentContent = activity
    .filter(a => a.type === 'content')
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      title: a.title,
      status: (a.metadata?.status as string) || 'draft',
      platform: (a.metadata?.platform as string) || '',
      updated_at: a.timestamp,
    }));

  // Extract transactions from activity for the credits tab
  const transactions = activity
    .filter(a => a.type === 'credit_transaction')
    .map(a => ({
      id: a.id,
      transaction_type: (a.metadata?.transaction_type as string) || '',
      credits_amount: (a.metadata?.credits_amount as number) || 0,
      description: a.description,
      created_at: a.timestamp,
    }));

  const totalCreditsUsed = creditsByFeature.reduce((sum, f) => sum + f.credits_charged, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'team', label: `Team (${(teamMembers || []).length})` },
    { key: 'billing', label: 'Billing' },
    { key: 'activity', label: 'Activity' },
    { key: 'credits', label: 'Credits & Usage' },
  ];

  return (
    <div>
      {/* Org Assignment Popup */}
      {showOrgPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-teal/[0.08] p-6 w-full max-w-md mx-4">
            <h3 className="font-serif text-lg font-bold text-charcoal mb-1">
              Assign Organization
            </h3>
            <p className="text-sm text-stone mb-4">
              Create a new organization for this user.
            </p>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAssignOrg()}
              className="w-full px-4 py-2.5 border border-cream rounded-lg text-charcoal placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowOrgPopup(false); setOrgName(''); }}
                className="text-sm font-medium text-stone hover:text-charcoal px-4 py-2 rounded-lg hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleAssignOrg}
                disabled={!orgName.trim()}
                isLoading={orgLoading}
                className="bg-teal hover:bg-teal-light text-white text-sm px-5 py-2 disabled:opacity-50"
              >
                Create & Assign
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3">
            &times;
          </button>
        </div>
      )}

      <PageHeader
        icon={UserCircleIcon}
        title={user.full_name}
        subtitle={user.email}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/users' },
          { label: 'Users', href: '/admin/users' },
          { label: user.full_name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-1.5 text-sm font-medium text-stone hover:text-charcoal px-3 py-2 rounded-lg hover:bg-cream transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </button>

            {/* Tier selector */}
            {organization && (
              <select
                value={currentTierId}
                onChange={(e) => handleTierChange(e.target.value)}
                disabled={tierLoading}
                className="text-sm border border-cream rounded-lg px-2.5 py-2 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal disabled:opacity-50 cursor-pointer"
              >
                <option value="">No tier</option>
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))}
              </select>
            )}

            {/* Delete */}
            {user.role !== 'super_admin' && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleAction({ action: 'delete' })}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2"
                    isLoading={actionLoading}
                  >
                    Confirm Delete
                  </Button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm text-stone hover:text-charcoal px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )
            )}
          </div>
        }
        className="mb-6"
      />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Tabbed content */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-cream mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'border-teal text-teal'
                    : 'border-transparent text-stone hover:text-charcoal hover:border-stone/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <UserOverviewTab
              contentStats={contentStats}
              brandProgress={brandProgress}
              creditsByFeature={creditsByFeature}
              subscriptionStatus={organization?.subscription?.status || null}
              totalCreditsUsed={totalCreditsUsed}
              recentContent={recentContent}
              teamMemberCount={(teamMembers || []).length}
            />
          )}

          {activeTab === 'team' && (
            <UserTeamTab
              teamMembers={teamMembers || []}
              pendingInvitations={pendingInvitations || []}
              userId={userId}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'billing' && (
            <UserBillingTab
              subscription={organization?.subscription || null}
              credits={organization?.credits || null}
              transactions={transactions}
              invoices={invoices || []}
              tiers={tiers}
              onPauseSubscription={() => handleAction({ action: 'pause_subscription' })}
              onCancelSubscription={() => handleAction({ action: 'cancel_subscription' })}
              onReactivateSubscription={() => handleAction({ action: 'reactivate_subscription' })}
              onChangeTier={handleTierChange}
              actionLoading={actionLoading}
              tierLoading={tierLoading}
            />
          )}

          {activeTab === 'activity' && (
            <UserActivityTimeline activity={activity} />
          )}

          {activeTab === 'credits' && (
            <UserCreditsTab
              credits={organization?.credits || null}
              creditsByFeature={creditsByFeature}
              transactions={transactions}
              monthlyAllocation={organization?.subscription?.tier?.monthly_credits || 0}
            />
          )}
        </div>

        {/* Right: Profile sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <UserProfileCard
            user={user}
            organization={organization}
            onApprove={() => handleAction({ approved: true })}
            onPause={() => handleAction({ action: 'pause' })}
            onAssignOrg={() => setShowOrgPopup(true)}
            onPauseSubscription={() => handleAction({ action: 'pause_subscription' })}
            onCancelSubscription={() => handleAction({ action: 'cancel_subscription' })}
            onReactivateSubscription={() => handleAction({ action: 'reactivate_subscription' })}
            actionLoading={actionLoading}
          />
        </div>
      </div>
    </div>
  );
}
