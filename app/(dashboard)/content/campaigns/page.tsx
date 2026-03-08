'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CampaignManager } from '@/components/content/campaign-manager';
import { CampaignWizard } from '@/components/content/campaign-wizard';
import { SequenceRecommendationCard } from '@/components/content/sequence-recommendation-card';
import type { CampaignObjectiveId } from '@/config/campaign-objectives';

export default function CampaignListPage() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [preselectedObjective, setPreselectedObjective] = useState<CampaignObjectiveId | undefined>();

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (membership?.organization_id) setOrganizationId(membership.organization_id);
    }
    loadOrg();
  }, []);

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showWizard) {
    return (
      <CampaignWizard
        organizationId={organizationId}
        initialObjective={preselectedObjective}
        onComplete={(campaignId) => {
          setShowWizard(false);
          router.push(`/content/campaigns/${campaignId}`);
        }}
        onCancel={() => {
          setShowWizard(false);
          setPreselectedObjective(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Sequence recommendation */}
      <SequenceRecommendationCard
        organizationId={organizationId}
        onStartCampaign={(objective) => {
          setPreselectedObjective(objective);
          setShowWizard(true);
        }}
      />

      {/* Campaign list */}
      <CampaignManager
        organizationId={organizationId}
        onCreateCampaign={() => setShowWizard(true)}
        onSelectCampaign={(id) => router.push(`/content/campaigns/${id}`)}
      />
    </div>
  );
}
