'use client';

import { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface TranscriptItem {
  id: string;
  speaker_label: string;
  content: string;
  timestamp_start: number; // milliseconds
  participant_id: string;
}

interface CallTranscriptViewerProps {
  roomCode: string;
}

function isHost(speakerLabel: string): boolean {
  const lower = speakerLabel.toLowerCase();
  return lower === 'you' || lower.includes('host');
}

function formatTimestamp(ms: number, baseMs: number): string {
  const elapsed = Math.max(0, ms - baseMs);
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function CallTranscriptViewer({ roomCode }: CallTranscriptViewerProps) {
  const [items, setItems] = useState<TranscriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchTranscripts() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/calls/${roomCode}/transcripts`);
        if (!res.ok) throw new Error('Failed to load transcript');
        const data: TranscriptItem[] = await res.json();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load transcript');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTranscripts();
    return () => { cancelled = true; };
  }, [roomCode]);

  const baseTimestamp = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.min(...items.map(i => i.timestamp_start));
  }, [items]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter(item => item.content.toLowerCase().includes(query));
  }, [items, search]);

  if (loading) {
    return (
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-8">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-8">
        <p className="text-sm text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-cream-warm rounded-xl border border-stone/10 flex flex-col">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-stone/10">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-stone/10 text-sm text-charcoal placeholder-stone/50 focus:outline-none focus:ring-1 focus:ring-teal/30 focus:border-teal/30"
          />
        </div>
      </div>

      {/* Transcript messages */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-stone">No transcript available for this call.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-stone">No results matching &ldquo;{search}&rdquo;</p>
          </div>
        ) : (
          filtered.map((item) => {
            const host = isHost(item.speaker_label);

            return (
              <div
                key={item.id}
                className={`flex ${host ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${host ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`flex items-baseline gap-2 ${host ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs font-bold text-charcoal">{item.speaker_label}</span>
                    <span className="text-xs text-stone">{formatTimestamp(item.timestamp_start, baseTimestamp)}</span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      host
                        ? 'bg-teal text-white rounded-tr-sm'
                        : 'bg-charcoal text-white rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{item.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
