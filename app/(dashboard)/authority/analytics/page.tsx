'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnalyticsSummary } from '@/components/authority/analytics-summary';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function AuthorityAnalyticsPage() {
  const supabase = createClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (data?.organization_id) setOrganizationId(data.organization_id);
    }
    init();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ChartBarIcon className="w-6 h-6 text-teal" />
        <h1 className="text-2xl font-serif font-bold text-charcoal">PR Analytics</h1>
      </div>

      {organizationId ? (
        <AnalyticsSummary organizationId={organizationId} />
      ) : (
        <div className="text-sm text-stone animate-pulse">Loading...</div>
      )}
    </div>
  );
}
