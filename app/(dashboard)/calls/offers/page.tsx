'use client';

import { useState, useEffect } from 'react';
import { OfferEditor } from '@/components/calls/offer-editor';

interface Offer {
  id: string;
  name: string;
  description: string | null;
  tier: string | null;
  price_display: string | null;
  price_value: number | null;
  currency: string;
  billing_frequency: string | null;
  deliverables: string[];
  value_propositions: string[];
  common_objections: Array<{ objection: string; response: string }>;
  is_active: boolean;
  sort_order: number;
  source: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    const res = await fetch('/api/calls/offers');
    const data = await res.json();
    if (Array.isArray(data)) setOffers(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this offer?')) return;
    await fetch(`/api/calls/offers/${id}`, { method: 'DELETE' });
    setOffers(prev => prev.filter(o => o.id !== id));
  }

  if (editing || creating) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => { setEditing(null); setCreating(false); }}
          className="text-sm text-teal hover:underline mb-4"
        >
          &larr; Back to Offers
        </button>
        <OfferEditor
          offer={editing || undefined}
          onSave={() => { setEditing(null); setCreating(false); loadOffers(); }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Offers</h1>
          <p className="text-sm text-stone mt-1">Structured offers synced to your Brand Engine for AI sales coaching</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setSyncing(true);
              setSyncMessage(null);
              try {
                const res = await fetch('/api/calls/offers/sync', { method: 'POST' });
                const result = await res.json();
                if (result.synced) {
                  setSyncMessage({ text: `Synced "${result.offerName}" from Brand Engine`, success: true });
                  await loadOffers();
                } else {
                  setSyncMessage({ text: result.reason || 'Sync returned no data', success: false });
                }
              } catch {
                setSyncMessage({ text: 'Sync request failed', success: false });
              }
              setSyncing(false);
            }}
            disabled={syncing}
            className="px-4 py-2 text-sm font-medium text-teal bg-teal/10 border border-teal/20 rounded-lg hover:bg-teal/20 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync from Brand Engine'}
          </button>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90"
          >
            New Offer
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          syncMessage.success
            ? 'bg-teal/10 border border-teal/20 text-teal'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {syncMessage.text}
        </div>
      )}

      {loading ? (
        <div className="text-stone text-sm animate-pulse">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 bg-cream-warm rounded-xl border border-stone/10">
          <p className="text-stone text-sm mb-2">No offers configured yet</p>
          <p className="text-xs text-stone">Create offers so the AI co-pilot can reference them during calls.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <div key={offer.id} className="bg-cream-warm rounded-xl border border-stone/10 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-charcoal">{offer.name}</h3>
                    {offer.source === 'brand_engine' && (
                      <span className="px-2 py-0.5 text-xs bg-teal/10 text-teal rounded-full">Brand Engine</span>
                    )}
                    {offer.tier && (
                      <span className="px-2 py-0.5 text-xs bg-gold/10 text-gold rounded-full">{offer.tier}</span>
                    )}
                    {!offer.is_active && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">Inactive</span>
                    )}
                  </div>
                  {offer.description && <p className="text-sm text-stone mt-1">{offer.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-stone">
                    {offer.price_display && <span className="font-medium text-charcoal">{offer.price_display}</span>}
                    {offer.billing_frequency && <span>{offer.billing_frequency}</span>}
                    <span>{Array.isArray(offer.deliverables) ? offer.deliverables.length : 0} deliverables</span>
                    <span>{Array.isArray(offer.common_objections) ? offer.common_objections.length : 0} objection responses</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(offer)} className="text-sm text-teal hover:underline">Edit</button>
                  <button onClick={() => handleDelete(offer.id)} className="text-sm text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
