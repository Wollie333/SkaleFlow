'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LifecycleBadge } from '@/components/crm/lifecycle-badge';
import type { CrmLifecycleStage } from '@/types/database';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  lifecycle_stage: string;
  source: string;
  created_at: string;
  company?: {
    id: string;
    name: string;
  };
}

interface ContactListProps {
  organizationId: string;
  onCreateClick: () => void;
}

export function ContactList({ organizationId, onCreateClick }: ContactListProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  const limit = 25;

  useEffect(() => {
    fetchContacts();
  }, [organizationId, page, search, lifecycleStage, companyFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [organizationId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (lifecycleStage) params.append('lifecycleStage', lifecycleStage);
      if (companyFilter) params.append('companyId', companyFilter);

      const response = await fetch(`/api/crm/contacts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');

      const data = await response.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`/api/crm/companies?organizationId=${organizationId}&limit=1000`);
      if (!response.ok) return;
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const lifecycleStages = [
    { value: '', label: 'All' },
    { value: 'lead', label: 'Lead' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'opportunity', label: 'Opportunity' },
    { value: 'customer', label: 'Customer' },
    { value: 'churned', label: 'Churned' },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
          <input
            type="text"
            placeholder="Search contacts by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-cream-warm border border-stone/10 rounded-lg text-charcoal placeholder:text-stone/60 focus:ring-2 focus:ring-teal focus:border-transparent"
          />
        </div>

        {/* Lifecycle Pills + Company Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {lifecycleStages.map((stage) => (
              <button
                key={stage.value}
                onClick={() => {
                  setLifecycleStage(stage.value);
                  setPage(1);
                }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  lifecycleStage === stage.value
                    ? 'bg-teal text-white'
                    : 'bg-cream text-charcoal hover:bg-cream-warm'
                )}
              >
                {stage.label}
              </button>
            ))}
          </div>

          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-cream-warm border border-stone/10 rounded-lg text-charcoal focus:ring-2 focus:ring-teal focus:border-transparent"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 bg-cream-warm rounded-lg border border-stone/10">
          <p className="text-charcoal font-medium">No contacts found</p>
          <p className="text-sm text-stone mt-2">Get started by adding your first contact</p>
        </div>
      ) : (
        <div className="bg-cream-warm rounded-lg border border-stone/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream border-b border-stone/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Lifecycle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone uppercase tracking-wider">
                  Created
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-charcoal">
                      {contact.first_name} {contact.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                    {contact.company?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <LifecycleBadge stage={contact.lifecycle_stage as CrmLifecycleStage} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone capitalize">
                    {contact.source.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-cream-warm rounded-lg border border-stone/10">
          <p className="text-sm text-stone">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} contacts
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-stone/10 rounded-lg text-sm text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cream/50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
