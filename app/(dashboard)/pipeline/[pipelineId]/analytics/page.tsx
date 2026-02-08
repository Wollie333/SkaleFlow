'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { UsersIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui';

interface Stage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_win_stage: boolean;
  is_loss_stage: boolean;
}

interface Contact {
  id: string;
  stage_id: string;
  value_cents: number;
  created_at: string;
}

export default function PipelineAnalyticsPage() {
  const params = useParams();
  const pipelineId = params.pipelineId as string;

  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [pipelineRes, contactsRes] = await Promise.all([
      fetch(`/api/pipeline/${pipelineId}`),
      fetch(`/api/pipeline/${pipelineId}/contacts`),
    ]);

    if (pipelineRes.ok) {
      const data = await pipelineRes.json();
      setStages([...(data.pipeline_stages || [])].sort((a: Stage, b: Stage) => a.sort_order - b.sort_order));
    }

    if (contactsRes.ok) {
      const data = await contactsRes.json();
      setContacts(data);
    }

    setLoading(false);
  }, [pipelineId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  const totalContacts = contacts.length;
  const totalValue = contacts.reduce((sum, c) => sum + c.value_cents, 0);
  const wonContacts = contacts.filter((c) => {
    const stage = stages.find((s) => s.id === c.stage_id);
    return stage?.is_win_stage;
  });
  const lostContacts = contacts.filter((c) => {
    const stage = stages.find((s) => s.id === c.stage_id);
    return stage?.is_loss_stage;
  });
  const wonValue = wonContacts.reduce((sum, c) => sum + c.value_cents, 0);
  const winRate = totalContacts > 0 ? Math.round((wonContacts.length / totalContacts) * 100) : 0;

  const stageData = stages.map((stage) => {
    const stageContacts = contacts.filter((c) => c.stage_id === stage.id);
    const stageValue = stageContacts.reduce((sum, c) => sum + c.value_cents, 0);
    return {
      ...stage,
      contactCount: stageContacts.length,
      value: stageValue,
      percentage: totalContacts > 0 ? Math.round((stageContacts.length / totalContacts) * 100) : 0,
    };
  });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Pipeline Analytics"
        icon={ChartBarIcon}
        breadcrumbs={[
          { label: 'Pipeline', href: '/pipeline' },
          { label: 'Analytics' },
        ]}
        className="mb-6"
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 text-stone mb-2">
            <UsersIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Total Contacts</span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{totalContacts}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 text-stone mb-2">
            <CurrencyDollarIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-charcoal">R {(totalValue / 100).toLocaleString('en-ZA')}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 text-stone mb-2">
            <ChartBarIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-teal">{winRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <div className="flex items-center gap-2 text-stone mb-2">
            <CurrencyDollarIcon className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Won Value</span>
          </div>
          <p className="text-2xl font-bold text-teal">R {(wonValue / 100).toLocaleString('en-ZA')}</p>
        </div>
      </div>

      {/* Stage Breakdown */}
      <section className="bg-white rounded-xl border border-stone/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Stage Breakdown</h2>
        <div className="space-y-4">
          {stageData.map((stage) => (
            <div key={stage.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-medium text-charcoal">{stage.name}</span>
                </div>
                <div className="text-sm text-stone">
                  {stage.contactCount} contacts &middot; R {(stage.value / 100).toLocaleString('en-ZA')}
                </div>
              </div>
              <div className="h-3 bg-stone/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${stage.percentage}%`,
                    backgroundColor: stage.color,
                    minWidth: stage.contactCount > 0 ? '2%' : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Conversion Funnel */}
      <section className="bg-white rounded-xl border border-stone/10 p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Conversion Funnel</h2>
        <div className="flex items-end gap-2 h-48">
          {stageData.map((stage) => {
            const maxCount = Math.max(...stageData.map((s) => s.contactCount), 1);
            const height = (stage.contactCount / maxCount) * 100;
            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center">
                <span className="text-xs text-stone mb-1">{stage.contactCount}</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    backgroundColor: stage.color,
                  }}
                />
                <span className="text-[10px] text-stone mt-2 text-center truncate w-full">
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
