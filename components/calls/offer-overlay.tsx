'use client';

import { useState, useEffect } from 'react';

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
  const [viewMode, setViewMode] = useState<'expanded' | 'minimized'>('expanded');
  // Animation state: 'idle' | 'minimizing' | 'expanding'
  const [animating, setAnimating] = useState<string>('idle');

  // When a new offer arrives, always show expanded
  useEffect(() => {
    setViewMode('expanded');
    setAnimating('idle');
  }, [offer.id]);

  const handleMinimize = () => {
    setAnimating('minimizing');
    setTimeout(() => {
      setViewMode('minimized');
      setAnimating('idle');
    }, 300);
  };

  const handleExpand = () => {
    setViewMode('expanded');
    setAnimating('expanding');
    setTimeout(() => setAnimating('idle'), 300);
  };

  // Minimized — sidebar tab pinned to the right
  if (viewMode === 'minimized') {
    return (
      <button
        onClick={handleExpand}
        className="absolute top-4 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1E6B63] to-[#C9A84C] rounded-xl shadow-lg shadow-black/30 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-[slideInRight_0.3s_ease-out]"
        title="View offer"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-white text-sm font-semibold max-w-[160px] truncate">{offer.name}</span>
        <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
      </button>
    );
  }

  // Expanded — full-page modal overlay
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 transition-all duration-300 ${
        animating === 'expanding'
          ? 'animate-[fadeIn_0.3s_ease-out]'
          : animating === 'minimizing'
          ? 'opacity-0 scale-95 pointer-events-none'
          : ''
      }`}
    >
      {/* Backdrop — semi-transparent so video is still visible */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleMinimize} />

      {/* Modal card */}
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1A2F2D] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 transition-all duration-300 ${
          animating === 'expanding' ? 'animate-[scaleIn_0.3s_ease-out]' : ''
        }`}
      >
        {/* Header with gradient */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#1E6B63]/90 to-[#C9A84C]/30 backdrop-blur-md px-6 py-5 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              {offer.tier && (
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest bg-white/10 text-white/80 rounded-full mb-2">
                  {offer.tier}
                </span>
              )}
              <h2 className="text-white text-xl font-bold leading-tight">{offer.name}</h2>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Minimize button */}
              <button
                onClick={handleMinimize}
                className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                title="Minimize to sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dismiss button */}
              <button
                onClick={onDismiss}
                className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Body — all content visible */}
        <div className="px-6 py-6 space-y-6">
          {/* Price block */}
          {offer.price_display && (
            <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-gold text-4xl font-bold tracking-tight">{offer.price_display}</span>
              {offer.billing_frequency && (
                <span className="text-white/40 text-base ml-1.5">/{offer.billing_frequency}</span>
              )}
            </div>
          )}

          {/* Description */}
          {offer.description && (
            <p className="text-white/70 text-sm leading-relaxed">{offer.description}</p>
          )}

          {/* Deliverables */}
          {offer.deliverables.length > 0 && (
            <div>
              <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What&apos;s Included
              </h4>
              <ul className="space-y-2.5">
                {offer.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm group">
                    <span className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-white/80 leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Value propositions */}
          {offer.value_propositions.length > 0 && (
            <div className="bg-gradient-to-br from-gold/10 to-teal/5 rounded-xl p-4 border border-gold/10">
              <h4 className="text-gold text-xs font-semibold uppercase tracking-wider mb-3">Why This Works</h4>
              <ul className="space-y-2">
                {offer.value_propositions.map((v, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="text-gold mt-0.5">&#x2726;</span>
                    <span className="text-white/70 leading-relaxed">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky action buttons */}
        <div className="sticky bottom-0 px-6 py-4 bg-[#1A2F2D]/95 backdrop-blur-md border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handleMinimize}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              View Later
            </button>
            <button
              onClick={onAccept}
              className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-gold to-gold/80 text-dark text-sm font-bold hover:from-gold/90 hover:to-gold/70 transition-all shadow-lg shadow-gold/20"
            >
              Accept Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
