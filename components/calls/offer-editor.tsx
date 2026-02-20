'use client';

import { useState } from 'react';

interface Offer {
  id?: string;
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
  source?: string;
}

export function OfferEditor({ offer, onSave }: { offer?: Offer; onSave: () => void }) {
  const [name, setName] = useState(offer?.name || '');
  const [description, setDescription] = useState(offer?.description || '');
  const [tier, setTier] = useState(offer?.tier || '');
  const [priceDisplay, setPriceDisplay] = useState(offer?.price_display || '');
  const [billingFreq, setBillingFreq] = useState(offer?.billing_frequency || 'monthly');
  const [deliverables, setDeliverables] = useState<string[]>(
    Array.isArray(offer?.deliverables) ? offer.deliverables as string[] : []
  );
  const [valueProps, setValueProps] = useState<string[]>(
    Array.isArray(offer?.value_propositions) ? offer.value_propositions as string[] : []
  );
  const [objections, setObjections] = useState<Array<{ objection: string; response: string }>>(
    Array.isArray(offer?.common_objections) ? offer.common_objections : []
  );
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newValueProp, setNewValueProp] = useState('');
  const [newObjection, setNewObjection] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name) return;
    setSaving(true);

    const payload = {
      name,
      description: description || null,
      tier: tier || null,
      priceDisplay: priceDisplay || null,
      billingFrequency: billingFreq || null,
      deliverables,
      valuePropositions: valueProps,
      commonObjections: objections,
    };

    const url = offer?.id ? `/api/calls/offers/${offer.id}` : '/api/calls/offers';
    const method = offer?.id ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    onSave();
  }

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 p-6 space-y-6">
      <h2 className="text-lg font-serif font-bold text-charcoal">{offer?.id ? 'Edit Offer' : 'New Offer'}</h2>

      {offer?.source === 'brand_engine' && (
        <div className="bg-teal/5 border border-teal/20 rounded-lg px-4 py-3 text-sm text-teal">
          This offer was synced from Brand Engine Phase 4. Re-locking Phase 4 will update synced fields.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-charcoal mb-1">Offer Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm" placeholder="e.g. Growth Package" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Tier</label>
          <input type="text" value={tier} onChange={e => setTier(e.target.value)} className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm" placeholder="e.g. Premium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Price Display</label>
          <input type="text" value={priceDisplay} onChange={e => setPriceDisplay(e.target.value)} className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm" placeholder="e.g. R5,000/month" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Billing Frequency</label>
          <select value={billingFreq} onChange={e => setBillingFreq(e.target.value)} className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm">
            <option value="once">Once-off</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Deliverables */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Deliverables</label>
        <div className="space-y-1 mb-2">
          {deliverables.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-charcoal flex-1">{d}</span>
              <button onClick={() => setDeliverables(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newDeliverable} onChange={e => setNewDeliverable(e.target.value)} className="flex-1 px-3 py-1.5 border border-stone/20 rounded-lg text-sm" placeholder="Add deliverable" onKeyDown={e => { if (e.key === 'Enter' && newDeliverable) { setDeliverables(prev => [...prev, newDeliverable]); setNewDeliverable(''); }}} />
          <button onClick={() => { if (newDeliverable) { setDeliverables(prev => [...prev, newDeliverable]); setNewDeliverable(''); }}} className="px-3 py-1.5 text-sm bg-cream rounded-lg hover:bg-stone/10">Add</button>
        </div>
      </div>

      {/* Value Propositions */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Value Propositions</label>
        <div className="space-y-1 mb-2">
          {valueProps.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-charcoal flex-1">{v}</span>
              <button onClick={() => setValueProps(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newValueProp} onChange={e => setNewValueProp(e.target.value)} className="flex-1 px-3 py-1.5 border border-stone/20 rounded-lg text-sm" placeholder="Add value proposition" onKeyDown={e => { if (e.key === 'Enter' && newValueProp) { setValueProps(prev => [...prev, newValueProp]); setNewValueProp(''); }}} />
          <button onClick={() => { if (newValueProp) { setValueProps(prev => [...prev, newValueProp]); setNewValueProp(''); }}} className="px-3 py-1.5 text-sm bg-cream rounded-lg hover:bg-stone/10">Add</button>
        </div>
      </div>

      {/* Objection Bank */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Objection Responses</label>
        <div className="space-y-2 mb-2">
          {objections.map((o, i) => (
            <div key={i} className="border border-stone/10 rounded-lg p-3">
              <p className="text-sm font-medium text-red-600">&ldquo;{o.objection}&rdquo;</p>
              <p className="text-sm text-charcoal mt-1">{o.response}</p>
              <button onClick={() => setObjections(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:underline mt-1">Remove</button>
            </div>
          ))}
        </div>
        <div className="space-y-2 border border-stone/10 rounded-lg p-3">
          <input type="text" value={newObjection} onChange={e => setNewObjection(e.target.value)} className="w-full px-3 py-1.5 border border-stone/20 rounded-lg text-sm" placeholder="Common objection" />
          <textarea value={newResponse} onChange={e => setNewResponse(e.target.value)} className="w-full px-3 py-1.5 border border-stone/20 rounded-lg text-sm" rows={2} placeholder="Your response" />
          <button onClick={() => { if (newObjection && newResponse) { setObjections(prev => [...prev, { objection: newObjection, response: newResponse }]); setNewObjection(''); setNewResponse(''); }}} className="px-3 py-1.5 text-sm bg-cream rounded-lg hover:bg-stone/10">Add Objection Response</button>
        </div>
      </div>

      <button onClick={handleSave} disabled={!name || saving} className="w-full py-3 rounded-lg bg-gold text-dark font-semibold text-sm hover:bg-gold/90 disabled:opacity-50">
        {saving ? 'Saving...' : offer?.id ? 'Save Changes' : 'Create Offer'}
      </button>
    </div>
  );
}
