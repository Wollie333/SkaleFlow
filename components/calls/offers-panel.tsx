'use client';

import { useState, useEffect } from 'react';
import type { Participant } from './call-room';

export interface Offer {
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

// Per-offer response status from attendees
export type OfferResponseStatus = 'pending' | 'accepted' | 'declined' | 'minimized';

export interface OfferResponse {
  participantName: string;
  status: OfferResponseStatus;
  reason?: string;
}

// Map of offerId -> participantId -> response
export type OfferResponseMap = Record<string, Record<string, OfferResponse>>;

interface OffersPanelProps {
  onPresentOffer: (offer: Offer, targetParticipantIds: string[]) => void;
  onDismissOffer: () => void;
  presentedOfferId: string | null;
  offerResponses: OfferResponseMap;
  participants: Participant[];
}

export function OffersPanel({
  onPresentOffer, onDismissOffer, presentedOfferId, offerResponses, participants,
}: OffersPanelProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  // Attendee selector state: offerId -> Set of selected participant IDs
  const [selectedTargets, setSelectedTargets] = useState<Record<string, Set<string>>>({});
  const [expandedSelector, setExpandedSelector] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/calls/offers')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOffers(data.filter((o: Offer) => o.is_active));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Attendees who can receive offers (in_call, not host)
  const eligibleAttendees = participants.filter(
    p => p.status === 'in_call' && p.role !== 'host'
  );

  const toggleTarget = (offerId: string, participantId: string) => {
    setSelectedTargets(prev => {
      const current = prev[offerId] || new Set<string>();
      const next = new Set(current);
      if (next.has(participantId)) next.delete(participantId);
      else next.add(participantId);
      return { ...prev, [offerId]: next };
    });
  };

  const selectAll = (offerId: string) => {
    setSelectedTargets(prev => ({
      ...prev,
      [offerId]: new Set(eligibleAttendees.map(p => p.id)),
    }));
  };

  const handlePresent = (offer: Offer) => {
    const targets = selectedTargets[offer.id];
    const ids = targets ? Array.from(targets) : eligibleAttendees.map(p => p.id);
    onPresentOffer(offer, ids);
    setExpandedSelector(null);
  };

  const deliverablesList = (offer: Offer): string[] => {
    if (Array.isArray(offer.deliverables)) return offer.deliverables as string[];
    return [];
  };

  // Determine the aggregate status for an offer's card color
  const getOfferCardStatus = (offerId: string): 'idle' | 'presented' | 'accepted' | 'declined' | 'minimized' => {
    if (presentedOfferId !== offerId) {
      // Check if there are any past responses
      const responses = offerResponses[offerId];
      if (!responses) return 'idle';
      const values = Object.values(responses);
      if (values.some(r => r.status === 'accepted')) return 'accepted';
      if (values.some(r => r.status === 'declined')) return 'declined';
      if (values.some(r => r.status === 'minimized')) return 'minimized';
      return 'idle';
    }
    // Currently presented — check responses
    const responses = offerResponses[offerId];
    if (!responses) return 'presented';
    const values = Object.values(responses);
    if (values.some(r => r.status === 'accepted')) return 'accepted';
    if (values.some(r => r.status === 'declined')) return 'declined';
    if (values.some(r => r.status === 'minimized')) return 'minimized';
    return 'presented';
  };

  const cardStyles: Record<string, string> = {
    idle: 'border-white/10 bg-white/5 hover:border-white/20',
    presented: 'border-gold/50 bg-gold/10',
    accepted: 'border-emerald-500/50 bg-emerald-500/10',
    declined: 'border-red-500/40 bg-red-500/10',
    minimized: 'border-gold/50 bg-gold/10',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-medium text-sm">Offers</h3>
        <p className="text-white/40 text-xs mt-0.5">Present an offer to specific attendees</p>
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
            const status = getOfferCardStatus(offer.id);
            const isPresented = presentedOfferId === offer.id;
            const items = deliverablesList(offer);
            const responses = offerResponses[offer.id];
            const isSelectorOpen = expandedSelector === offer.id;

            return (
              <div
                key={offer.id}
                className={`rounded-lg border p-3 transition-all duration-300 ${cardStyles[status]}`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">{offer.name}</h4>
                    {offer.tier && (
                      <span className="text-white/40 text-xs">{offer.tier}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Eye icon when minimized by attendee */}
                    {status === 'minimized' && (
                      <span className="text-gold" title="Attendee minimized this offer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </span>
                    )}
                    {offer.price_display && (
                      <span className="text-gold text-sm font-semibold whitespace-nowrap">
                        {offer.price_display}
                        {offer.billing_frequency && (
                          <span className="text-white/30 text-xs font-normal">/{offer.billing_frequency}</span>
                        )}
                      </span>
                    )}
                  </div>
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

                {/* Response badges */}
                {responses && Object.keys(responses).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.values(responses).map((r, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          r.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : r.status === 'declined'
                            ? 'bg-red-500/20 text-red-400'
                            : r.status === 'minimized'
                            ? 'bg-gold/20 text-gold'
                            : 'bg-white/10 text-white/50'
                        }`}
                        title={r.reason ? `${r.participantName}: ${r.reason}` : r.participantName}
                      >
                        {r.status === 'accepted' && '✓'}
                        {r.status === 'declined' && '✗'}
                        {r.status === 'minimized' && (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                        {r.participantName}
                      </span>
                    ))}
                  </div>
                )}

                {/* Attendee selector */}
                {isSelectorOpen && eligibleAttendees.length > 0 && (
                  <div className="mt-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-xs font-medium">Show to:</span>
                      <button
                        onClick={() => selectAll(offer.id)}
                        className="text-teal text-[10px] hover:underline"
                      >
                        Select all
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {eligibleAttendees.map(p => {
                        const isSelected = selectedTargets[offer.id]?.has(p.id) ?? false;
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => toggleTarget(offer.id, p.id)}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-teal border-teal'
                                : 'border-white/20 group-hover:border-white/40'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-white/70 text-xs">{p.name}</span>
                            <span className="text-white/30 text-[10px] capitalize">({p.role.replace('_', ' ')})</span>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePresent(offer)}
                      disabled={selectedTargets[offer.id]?.size === 0 && eligibleAttendees.length > 0}
                      className="mt-2.5 w-full py-1.5 rounded text-xs font-medium bg-teal/20 text-teal hover:bg-teal/30 border border-teal/30 transition-colors disabled:opacity-40"
                    >
                      Present to Selected ({selectedTargets[offer.id]?.size || eligibleAttendees.length})
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                {!isSelectorOpen && (
                  <>
                    {isPresented ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            // Init all selected, then open selector
                            setSelectedTargets(prev => ({
                              ...prev,
                              [offer.id]: new Set(eligibleAttendees.map(p => p.id)),
                            }));
                            setExpandedSelector(offer.id);
                          }}
                          className="flex-1 py-1.5 rounded text-xs font-medium bg-gold/20 text-gold border border-gold/30 transition-colors"
                        >
                          Re-present
                        </button>
                        <button
                          onClick={onDismissOffer}
                          className="flex-1 py-1.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                          Hide from All
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (eligibleAttendees.length <= 1) {
                            // Only one attendee — present directly
                            handlePresent(offer);
                          } else {
                            // Multiple attendees — open selector
                            setSelectedTargets(prev => ({
                              ...prev,
                              [offer.id]: new Set(eligibleAttendees.map(p => p.id)),
                            }));
                            setExpandedSelector(offer.id);
                          }
                        }}
                        className="mt-3 w-full py-1.5 rounded text-xs font-medium bg-teal/20 text-teal hover:bg-teal/30 border border-teal/30 transition-colors"
                      >
                        Present to Attendees
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
