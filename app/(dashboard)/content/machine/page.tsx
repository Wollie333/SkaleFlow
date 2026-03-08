'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdsManagerView } from '@/components/content-machine/ads-manager-view';
import { CampaignWizard } from '@/components/content/campaign-wizard';

export default function ContentMachinePage() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generatingBatchId, setGeneratingBatchId] = useState<string | null>(null);

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

  function handleGenerationDone() {
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
    <AdsManagerView
      key={refreshKey}
      organizationId={organizationId}
      onCreateCampaign={() => setShowWizard(true)}
      generatingBatchId={generatingBatchId}
      onGenerationComplete={handleGenerationDone}
      onGenerationCancel={handleGenerationDone}
    />
  );
}
