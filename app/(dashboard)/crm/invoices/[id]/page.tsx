'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InvoiceBuilder } from '@/components/crm/invoice-builder';

interface Invoice {
  id: string;
  status: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/crm/invoices/${invoiceId}`);
        if (!res.ok) throw new Error('Failed to fetch invoice');
        const data = await res.json();
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  if (loading || !organizationId) {
    return <div className="p-6"><div className="animate-pulse bg-gray-100 rounded-xl h-96" /></div>;
  }

  if (!invoice) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-stone">Invoice not found</p>
        </div>
      </div>
    );
  }

  const mode = invoice.status === 'draft' ? 'edit' : 'view';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <InvoiceBuilder
        mode={mode}
        invoiceId={invoiceId}
        organizationId={organizationId}
      />
    </div>
  );
}
