'use client';

import { useState, useEffect } from 'react';

interface Offer {
  id: string;
  name: string;
  description: string | null;
  tier: string | null;
  price_display: string | null;
  price_value: number | null;
  currency: string;
  billing_frequency: string | null;
  deliverables: unknown;
  value_propositions: unknown;
  is_active: boolean;
}

interface OffersPanelProps {
  onPresentOffer: (offer: Offer) => void;
  presentedOfferId: string | null;
}

export function OffersPanel({ onPresentOffer, presentedOfferId }: OffersPanelProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calls/offers')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOffers(data.filter((o: Offer) => o.is_active));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deliverablesList = (offer: Offer): string[] => {
    if (Array.isArray(offer.deliverables)) return offer.deliverables as string[];
    return [];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-medium text-sm">Offers</h3>
        <p className="text-white/40 text-xs mt-0.5">Present an offer to attendees</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-5 h-5 border-2 border-white/20 border-t-teal rounded-full animate-spin mx-auto" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">No offers found</p>
            <a href="/calls/offers" target="_blank" className="text-teal text-xs hover:underline mt-1 inline-block">
              Create offers
            </a>
          </div>
        ) : (
          offers.map(offer => {
            const isPresented = presentedOfferId === offer.id;
            const items = deliverablesList(offer);

            return (
              <div
                key={offer.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isPresented
                    ? 'border-gold/50 bg-gold/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">{offer.name}</h4>
                    {offer.tier && (
                      <span className="text-white/40 text-xs">{offer.tier}</span>
                    )}
                  </div>
                  {offer.price_display && (
                    <span className="text-gold text-sm font-semibold whitespace-nowrap">
                      {offer.price_display}
                      {offer.billing_frequency && (
                        <span className="text-white/30 text-xs font-normal">/{offer.billing_frequency}</span>
                      )}
                    </span>
                  )}
                </div>

                {offer.description && (
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{offer.description}</p>
                )}

                {items.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {items.slice(0, 3).map((d, i) => (
                      <li key={i} className="text-white/40 text-xs flex items-start gap-1.5">
                        <span className="text-teal mt-0.5">&#10003;</span>
                        <span className="line-clamp-1">{d}</span>
                      </li>
                    ))}
                    {items.length > 3 && (
                      <li className="text-white/30 text-xs">+{items.length - 3} more</li>
                    )}
                  </ul>
                )}

                <button
                  onClick={() => onPresentOffer(offer)}
                  className={`mt-3 w-full py-1.5 rounded text-xs font-medium transition-colors ${
                    isPresented
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'bg-teal/20 text-teal hover:bg-teal/30 border border-teal/30'
                  }`}
                >
                  {isPresented ? 'Currently Presenting' : 'Present to Attendees'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
