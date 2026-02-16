'use client';

import { useState, useEffect } from 'react';

export function PreCallBrief({ roomCode }: { roomCode: string }) {
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateBrief() {
    setLoading(true);
    const res = await fetch(`/api/calls/${roomCode}/brief`, { method: 'POST' });
    const data = await res.json();
    setBrief(data.brief);
    setLoading(false);
  }

  if (!brief && !loading) {
    return (
      <div className="bg-white rounded-xl border border-stone/10 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-2">Pre-Call Brief</h3>
        <p className="text-sm text-stone mb-3">Generate an AI-powered preparation brief for this call.</p>
        <button
          onClick={generateBrief}
          className="px-4 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 transition-colors"
        >
          Generate Brief
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-stone/10 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-2">Pre-Call Brief</h3>
        <div className="animate-pulse text-sm text-stone">Generating your preparation brief...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone/10 p-5">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Pre-Call Brief</h3>
      <div className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">{brief}</div>
    </div>
  );
}
