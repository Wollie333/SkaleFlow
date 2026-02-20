'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditStatusBadge } from '@/components/brand-audit/audit-status-badge';
import { CreateAuditModal } from '@/components/brand-audit/create-audit-modal';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface AuditListItem {
  id: string;
  status: string;
  source: string;
  overall_score: number | null;
  overall_rating: string | null;
  sections_completed: number;
  total_sections: number;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    crm_companies?: { name: string } | null;
  } | null;
  creator?: { full_name: string } | null;
}

export default function BrandAuditListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState(statusFilter || '');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadOrg = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (membership) setOrganizationId(membership.organization_id);
    };
    loadOrg();
  }, []);

  const fetchAudits = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizationId });
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/brand-audits?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAudits(data);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, filterStatus]);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  const filteredAudits = audits.filter((a) => {
    if (!search) return true;
    const contactName = a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : '';
    const companyName = a.contact?.crm_companies?.name || '';
    return contactName.toLowerCase().includes(search.toLowerCase()) ||
      companyName.toLowerCase().includes(search.toLowerCase());
  });

  const statusOptions = ['', 'draft', 'in_progress', 'review', 'scoring', 'complete', 'report_generated', 'delivered'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Brand Audits</h1>
          <p className="text-sm text-stone mt-1">
            Run structured brand diagnostics on prospects and clients
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-teal hover:bg-teal-dark text-white">
          <PlusIcon className="w-4 h-4 mr-2" />
          New Brand Audit
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            type="text"
            placeholder="Search by contact or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-stone/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-stone" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-stone/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">All Statuses</option>
            {statusOptions.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl h-20 border border-stone/10" />
          ))}
        </div>
      ) : filteredAudits.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-stone text-sm">
            {audits.length === 0 ? 'No brand audits yet. Create your first one!' : 'No audits match your filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAudits.map((audit) => (
            <Card
              key={audit.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-stone/10"
              onClick={() => router.push(`/brand-audit/${audit.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Score indicator */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2"
                    style={{
                      borderColor: audit.overall_rating === 'green' ? '#10B981'
                        : audit.overall_rating === 'amber' ? '#F59E0B' : '#EF4444',
                      color: audit.overall_rating === 'green' ? '#10B981'
                        : audit.overall_rating === 'amber' ? '#F59E0B' : '#EF4444',
                    }}
                  >
                    {audit.overall_score != null ? Math.round(audit.overall_score) : '—'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-charcoal">
                        {audit.contact
                          ? `${audit.contact.first_name} ${audit.contact.last_name}`
                          : 'Unlinked Audit'}
                      </h3>
                      <AuditStatusBadge status={audit.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone mt-1">
                      {audit.contact?.crm_companies?.name && (
                        <span>{audit.contact.crm_companies.name}</span>
                      )}
                      <span className="capitalize">{audit.source}</span>
                      <span>{new Date(audit.created_at).toLocaleDateString('en-ZA')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-stone">
                    <div>{audit.sections_completed}/{audit.total_sections} sections</div>
                    {audit.creator && <div>by {audit.creator.full_name}</div>}
                  </div>
                  <Badge variant="default" className="capitalize text-xs">
                    {audit.source}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && organizationId && (
        <CreateAuditModal
          organizationId={organizationId}
          onClose={() => setShowCreateModal(false)}
          onCreated={(auditId) => {
            setShowCreateModal(false);
            router.push(`/brand-audit/${auditId}`);
          }}
        />
      )}
    </div>
  );
}
