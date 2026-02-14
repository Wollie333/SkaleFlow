'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthorityBoard } from '@/components/authority/authority-board';
import { FinancialSummaryBar } from '@/components/authority/financial-summary-bar';
import { CreateCardModal } from '@/components/authority/create-card-modal';
import { CardDetailPanel } from '@/components/authority/card-detail-panel';
import { AuthorityDashboard } from '@/components/authority/authority-dashboard';
import { PlusIcon, NewspaperIcon, ChartBarIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

export default function AuthorityPipelinePage() {
  const supabase = createClient();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [stages, setStages] = useState<Array<{
    id: string; name: string; slug: string; stage_order: number; stage_type: string; color: string | null;
  }>>([]);
  const [cards, setCards] = useState<unknown[]>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; full_name: string; outlet: string | null }>>([]);
  const [storyAngles, setStoryAngles] = useState<Array<{ id: string; title: string }>>([]);
  const [financials, setFinancials] = useState({
    total_committed: 0, total_paid: 0, total_pending: 0, total_overdue: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dashboard'>('pipeline');
  const [loading, setLoading] = useState(true);

  // Get organization ID
  useEffect(() => {
    async function getOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      if (data?.organization_id) setOrganizationId(data.organization_id);
    }
    getOrg();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    const [stagesRes, cardsRes, contactsRes, anglesRes, financialsRes] = await Promise.all([
      fetch(`/api/authority/pipeline/stages?organizationId=${organizationId}`),
      fetch(`/api/authority/pipeline?organizationId=${organizationId}`),
      fetch(`/api/authority/contacts?organizationId=${organizationId}`),
      fetch(`/api/authority/story-angles?organizationId=${organizationId}`).catch(() => null),
      fetch(`/api/authority/pipeline/financial-summary?organizationId=${organizationId}`),
    ]);

    if (stagesRes.ok) setStages(await stagesRes.json());
    if (cardsRes.ok) setCards(await cardsRes.json());
    if (contactsRes.ok) setContacts(await contactsRes.json());
    if (anglesRes?.ok) setStoryAngles(await anglesRes.json());
    if (financialsRes.ok) setFinancials(await financialsRes.json());

    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCardMove = async (cardId: string, newStageId: string) => {
    // Optimistic update
    setCards((prev: unknown[]) =>
      (prev as Array<{ id: string; stage_id: string }>).map((c) =>
        c.id === cardId ? { ...c, stage_id: newStageId } : c
      )
    );

    const res = await fetch(`/api/authority/pipeline/${cardId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: newStageId }),
    });

    if (!res.ok) {
      loadData();
    }
  };

  const handleCardClick = (card: Parameters<typeof AuthorityBoard>[0]['cards'][number]) => {
    setSelectedCardId(card.id);
  };

  const handleCreateCard = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/authority/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, ...data }),
    });

    if (res.ok) {
      loadData();
    }
  };

  if (loading && stages.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <NewspaperIcon className="w-6 h-6 text-teal" />
          <h1 className="text-2xl font-serif font-bold text-charcoal">Authority Engine</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-stone">Loading pipeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <NewspaperIcon className="w-6 h-6 text-teal" />
          <h1 className="text-2xl font-serif font-bold text-charcoal">Authority Engine</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-white border border-stone/15 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-charcoal hover:bg-cream-warm'
              }`}
            >
              <ViewColumnsIcon className="w-3.5 h-3.5" />
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-charcoal hover:bg-cream-warm'
              }`}
            >
              <ChartBarIcon className="w-3.5 h-3.5" />
              Score
            </button>
          </div>

          {activeTab === 'pipeline' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New PR Opportunity
            </button>
          )}
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <>
          {/* Financial Summary */}
          <FinancialSummaryBar
            totalCommitted={financials.total_committed}
            totalPaid={financials.total_paid}
            totalPending={financials.total_pending}
            totalOverdue={financials.total_overdue}
          />

          {/* Kanban Board */}
          <AuthorityBoard
            stages={stages}
            cards={cards as Parameters<typeof AuthorityBoard>[0]['cards']}
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
            onAddCard={() => setShowCreateModal(true)}
          />
        </>
      ) : (
        organizationId && <AuthorityDashboard organizationId={organizationId} />
      )}

      {/* Create Modal */}
      <CreateCardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCard}
        contacts={contacts}
        storyAngles={storyAngles}
      />

      {/* Card Detail Panel */}
      <CardDetailPanel
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
        onUpdate={loadData}
        contacts={contacts}
      />
    </div>
  );
}
