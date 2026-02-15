'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CrmDashboard } from '@/components/crm/crm-dashboard';

export default function CrmDashboardPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase.from('org_members').select('organization_id').eq('user_id', user.id).single();
      if (membership) setOrganizationId(membership.organization_id);
    };
    load();
  }, []);

  if (!organizationId) return <div className="p-6"><div className="animate-pulse bg-gray-100 rounded-xl h-96" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">CRM</h1>
        <p className="text-sm text-stone mt-1">Manage your contacts, deals, and invoices</p>
      </div>
      <CrmDashboard organizationId={organizationId} />
    </div>
  );
}
