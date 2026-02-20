'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  lifecycle_stage: string | null;
  job_title: string | null;
}

interface Deal {
  id: string;
  name: string;
  amount: number | null;
  stage: string;
  probability: number | null;
  expected_close_date: string | null;
}

interface CompanyDetailTabsProps {
  companyId: string;
  organizationId: string;
}

type TabType = 'contacts' | 'deals' | 'activity';

export default function CompanyDetailTabs({ companyId, organizationId }: CompanyDetailTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'contacts') {
      fetchContacts();
    } else if (activeTab === 'deals') {
      fetchDeals();
    }
  }, [activeTab, companyId, organizationId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/crm/contacts?organizationId=${organizationId}&companyId=${companyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/crm/deals?organizationId=${organizationId}`
      );
      if (!response.ok) throw new Error('Failed to fetch deals');
      const data = await response.json();

      // Filter deals by company_id
      const companyDeals = (data.deals || []).filter(
        (deal: any) => deal.company_id === companyId
      );
      setDeals(companyDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'R0';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'contacts', label: 'Contacts' },
    { id: 'deals', label: 'Deals' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="bg-cream-warm rounded-lg border border-stone/10">
      {/* Tab Headers */}
      <div className="flex gap-4 border-b border-stone/10 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-teal text-teal'
                : 'border-transparent text-stone hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
          </div>
        ) : (
          <>
            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div>
                {contacts.length === 0 ? (
                  <div className="text-center py-12 text-stone">
                    No contacts found for this company
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone/10">
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Lifecycle
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Job Title
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone/10">
                        {contacts.map((contact) => (
                          <tr
                            key={contact.id}
                            onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                            className="hover:bg-cream/50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-charcoal">
                                {contact.first_name} {contact.last_name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-stone">{contact.email || '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              {contact.lifecycle_stage ? (
                                <span className="px-2 py-1 bg-teal/10 text-teal rounded-full text-xs font-medium">
                                  {contact.lifecycle_stage}
                                </span>
                              ) : (
                                <span className="text-sm text-stone">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-stone">{contact.job_title || '-'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Deals Tab */}
            {activeTab === 'deals' && (
              <div>
                {deals.length === 0 ? (
                  <div className="text-center py-12 text-stone">
                    No deals found for this company
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone/10">
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Deal Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Stage
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Probability
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                            Expected Close
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone/10">
                        {deals.map((deal) => (
                          <tr
                            key={deal.id}
                            onClick={() => router.push(`/crm/deals/${deal.id}`)}
                            className="hover:bg-cream/50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-charcoal">{deal.name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-teal">
                                {formatCurrency(deal.amount)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-cream text-charcoal rounded-full text-xs font-medium">
                                {deal.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-stone">
                                {deal.probability ? `${deal.probability}%` : '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-stone">
                                {formatDate(deal.expected_close_date)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="text-center py-12">
                <div className="text-stone/60 mb-2">Activity tracking coming soon</div>
                <p className="text-sm text-stone">
                  View all interactions, notes, and timeline events for this company
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
