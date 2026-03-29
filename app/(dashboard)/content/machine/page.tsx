'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdsManagerView } from '@/components/content-machine/ads-manager-view';
import { CampaignWizard } from '@/components/content/campaign-wizard';
import { GenerationCompleteModal } from '@/components/content/generation-complete-modal';

export default function ContentMachinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generatingBatchId, setGeneratingBatchId] = useState<string | null>(null);
  const [newCampaignId, setNewCampaignId] = useState<string | null>(null);

  // Read initial state from URL params
  const urlTab = searchParams.get('tab') as 'campaigns' | 'adsets' | 'posts' | null;
  const urlCampaignId = searchParams.get('campaignId');
  const urlAdsetId = searchParams.get('adsetId');

  const [activeTab, setActiveTab] = useState<'campaigns' | 'adsets' | 'posts'>(urlTab || 'campaigns');
  const [initialCampaignId, setInitialCampaignId] = useState<string | null>(urlCampaignId);
  const [initialAdsetId, setInitialAdsetId] = useState<string | null>(urlAdsetId);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStats, setCompletionStats] = useState({ completed: 0, failed: 0 });

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (membership?.organization_id) setOrganizationId(membership.organization_id);
      setLoading(false);
    }
    loadOrg();
  }, []);

  async function handleWizardComplete(campaignId: string) {
    setShowWizard(false);
    setNewCampaignId(campaignId);

    // Auto-trigger post generation for the new campaign
    try {
      const res = await fetch(`/api/content/campaigns/${campaignId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.batchId) {
          setGeneratingBatchId(data.batchId);
          // Navigate to Posts tab to show generation progress
          setActiveTab('posts');
        }
      } else {
        console.error('Auto-generate failed:', await res.text());
      }
    } catch (err) {
      console.error('Auto-generate error:', err);
    }

    // Refresh table to show new campaign + idea posts
    setRefreshKey(k => k + 1);
  }

  async function handleGenerationDone() {
    // Fetch final batch stats before clearing
    if (generatingBatchId) {
      try {
        const res = await fetch(`/api/content/campaigns/queue?batchId=${generatingBatchId}`);
        if (res.ok) {
          const data = await res.json();
          setCompletionStats({
            completed: data.completedItems || 0,
            failed: data.failedItems || 0,
          });
          setShowCompletionModal(true);
        }
      } catch (err) {
        console.error('Failed to fetch final stats:', err);
      }
    }

    setGeneratingBatchId(null);
    setRefreshKey(k => k + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <p className="text-stone text-sm">No organization found. Please join or create one.</p>
      </div>
    );
  }

  if (showWizard) {
    return (
      <CampaignWizard
        organizationId={organizationId}
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <>
      <AdsManagerView
        key={refreshKey}
        organizationId={organizationId}
        onCreateCampaign={() => setShowWizard(true)}
        generatingBatchId={generatingBatchId}
        onGenerationComplete={handleGenerationDone}
        onGenerationCancel={handleGenerationDone}
        initialTab={activeTab}
        initialCampaignFilter={initialCampaignId || newCampaignId}
        initialAdsetFilter={initialAdsetId}
        onTabChange={setActiveTab}
      />

      {/* Completion Modal */}
      {showCompletionModal && (
        <GenerationCompleteModal
          totalGenerated={completionStats.completed}
          totalFailed={completionStats.failed}
          onClose={() => setShowCompletionModal(false)}
        />
      )}
    </>
  );
}
