'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CompanyDetailHeader from '@/components/crm/company-detail-header';
import CompanyDetailTabs from '@/components/crm/company-detail-tabs';
import CompanyFormModal from '@/components/crm/company-form-modal';

interface Company {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyStats {
  contacts_count: number;
  deals_value: number;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats>({ contacts_count: 0, deals_value: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

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
    if (!companyId) return;

    const fetchCompany = async () => {
      try {
        const res = await fetch(`/api/crm/companies/${companyId}`);
        if (!res.ok) throw new Error('Failed to fetch company');
        const data = await res.json();
        setCompany(data);

        // Fetch stats
        const [contactsRes, dealsRes] = await Promise.all([
          fetch(`/api/crm/contacts?companyId=${companyId}`),
          fetch(`/api/crm/deals?companyId=${companyId}`)
        ]);

        const contacts = await contactsRes.json();
        const deals = await dealsRes.json();

        setStats({
          contacts_count: contacts.length || 0,
          deals_value: deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
        });
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  if (loading || !organizationId) {
    return <div className="p-6"><div className="animate-pulse bg-gray-100 rounded-xl h-96" /></div>;
  }

  if (!company) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-stone">Company not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CompanyDetailHeader
        company={company}
        onEdit={() => setShowEditModal(true)}
        contactsCount={stats.contacts_count}
        dealsValue={stats.deals_value}
        activeDeals={0}
      />

      <div className="mt-6">
        <CompanyDetailTabs companyId={companyId} organizationId={organizationId} />
      </div>

      {showEditModal && (
        <CompanyFormModal
          isOpen={showEditModal}
          organizationId={organizationId}
          company={company}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
