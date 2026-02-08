'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

interface TopupPack {
  id: string;
  name: string;
  slug: string;
  credits: number;
  price_cents: number;
  description: string | null;
}

interface TopupModalProps {
  organizationId: string;
  onClose: () => void;
  message?: string;
}

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function TopupModal({ organizationId, onClose, message }: TopupModalProps) {
  const [packs, setPacks] = useState<TopupPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('credit_topup_packs')
      .select('id, name, slug, credits, price_cents, description')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setPacks(data);
        setIsLoading(false);
      });
  }, []);

  async function handleBuyPack(packSlug: string) {
    setIsCheckingOut(packSlug);

    try {
      const res = await fetch('/api/billing/topup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSlug, organizationId }),
      });

      if (res.ok) {
        const { authorizationUrl } = await res.json();
        window.location.href = authorizationUrl;
      } else {
        const { error } = await res.json();
        alert(error || 'Failed to start checkout');
      }
    } catch {
      alert('Failed to start checkout');
    } finally {
      setIsCheckingOut(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal">Credits Depleted</h3>
              <p className="text-xs text-stone mt-0.5">
                {message || 'You\'ve run out of AI credits. Top up to continue.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone hover:text-charcoal p-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-stone mb-4">
            Choose a credit pack below, or switch to a free AI model to continue without credits.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packs.map((pack) => (
                <Card key={pack.id} className="p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <BoltIcon className="w-4 h-4 text-gold" />
                    <h4 className="font-semibold text-sm text-charcoal">{pack.name}</h4>
                  </div>
                  <p className="text-xs text-stone flex-1">{pack.description}</p>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <p className="text-lg font-bold text-teal">{pack.credits.toLocaleString()}</p>
                      <p className="text-[11px] text-stone">credits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-charcoal">{formatZAR(pack.price_cents)}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBuyPack(pack.slug)}
                    disabled={isCheckingOut === pack.slug}
                    className="w-full mt-3"
                    size="sm"
                  >
                    {isCheckingOut === pack.slug ? 'Loading...' : 'Buy Now'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone/10 bg-cream-warm/50">
          <p className="text-xs text-stone">
            Top-up credits never expire. You can also switch to a free model.
          </p>
          <Button onClick={onClose} variant="ghost" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
