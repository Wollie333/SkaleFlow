'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WinnerPool } from '@/components/content/winner-pool';

export default function WinnerPoolPage() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

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

  return (
    <WinnerPool
      organizationId={organizationId}
      onRecycle={async (winnerId) => {
        try {
          await fetch(`/api/content/winners/${winnerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'recycle' }),
          });
          // Pool component will refresh itself
        } catch (err) {
          console.error('Failed to recycle:', err);
        }
      }}
      onViewPost={(postId, campaignId) => {
        router.push(`/content/campaigns/${campaignId}/posts/${postId}`);
      }}
    />
  );
}
