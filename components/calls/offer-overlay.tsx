'use client';

interface PresentedOffer {
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
}

interface OfferOverlayProps {
  offer: PresentedOffer;
  onAccept: () => void;
  onDismiss: () => void;
}

export function OfferOverlay({ offer, onAccept, onDismiss }: OfferOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#1A2F2D] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal/20 to-gold/10 px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              {offer.tier && (
                <span className="text-teal text-xs font-medium uppercase tracking-wider">{offer.tier}</span>
              )}
              <h3 className="text-white text-lg font-semibold mt-0.5">{offer.name}</h3>
            </div>
            <button
              onClick={onDismiss}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Price */}
          {offer.price_display && (
            <div className="text-center">
              <span className="text-gold text-3xl font-bold">{offer.price_display}</span>
              {offer.billing_frequency && (
                <span className="text-white/40 text-sm ml-1">/{offer.billing_frequency}</span>
              )}
            </div>
          )}

          {/* Description */}
          {offer.description && (
            <p className="text-white/60 text-sm leading-relaxed">{offer.description}</p>
          )}

          {/* Deliverables */}
          {offer.deliverables.length > 0 && (
            <div>
              <h4 className="text-white/70 text-xs font-medium uppercase tracking-wider mb-2">What&apos;s included</h4>
              <ul className="space-y-1.5">
                {offer.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-teal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/80">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Value propositions */}
          {offer.value_propositions.length > 0 && (
            <div className="bg-white/5 rounded-lg p-3">
              {offer.value_propositions.map((v, i) => (
                <p key={i} className="text-white/50 text-xs leading-relaxed">
                  {i > 0 && <span className="mx-1">&bull;</span>}
                  {v}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-lg bg-gold text-dark text-sm font-semibold hover:bg-gold/90 transition-colors"
          >
            Accept Offer
          </button>
        </div>
      </div>
    </div>
  );
}
