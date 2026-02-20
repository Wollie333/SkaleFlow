'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InvoiceBuilder } from '@/components/crm/invoice-builder';

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const initialContactId = searchParams.get('contactId');
  const initialDealId = searchParams.get('dealId');

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

  if (!organizationId) return <div className="p-6"><div className="animate-pulse bg-cream rounded-xl h-96" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <InvoiceBuilder
        mode="create"
        organizationId={organizationId}
        contactId={initialContactId || undefined}
        dealId={initialDealId || undefined}
      />
    </div>
  );
}
