'use client';

import { useState } from 'react';

export function FollowUpEditor({ draft, roomCode }: { draft: string | null; roomCode: string }) {
  const [content, setContent] = useState(draft || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setSending(true);
    const res = await fetch(`/api/calls/${roomCode}/follow-up/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailContent: content }),
    });
    setSending(false);
    if (res.ok) setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-stone/10">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-charcoal font-medium">Follow-up email sent!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone/10 p-5">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Follow-up Email Draft</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-3 py-2 border border-stone/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 font-mono"
        rows={15}
        placeholder="AI-generated follow-up email will appear here..."
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSend}
          disabled={!content || sending}
          className="px-5 py-2 text-sm font-medium text-dark bg-gold rounded-lg hover:bg-gold/90 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Follow-up Email'}
        </button>
      </div>
    </div>
  );
}
