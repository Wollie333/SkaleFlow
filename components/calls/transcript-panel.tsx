'use client';

import { useRef, useEffect, useState } from 'react';
import type { TranscriptChunk } from './call-room';

interface TranscriptPanelProps {
  transcripts: TranscriptChunk[];
}

export function TranscriptPanel({ transcripts }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  const filtered = search
    ? transcripts.filter(t => t.content.toLowerCase().includes(search.toLowerCase()))
    : transcripts;

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Assign colors to speakers
  const speakerColors: Record<string, string> = {};
  const colors = ['text-blue-300', 'text-green-300', 'text-purple-300', 'text-orange-300', 'text-pink-300', 'text-cyan-300'];
  let colorIdx = 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 md:px-4 py-3 border-b border-white/10">
        <h3 className="text-white text-sm font-semibold mb-2">Transcript</h3>
        <input
          type="text"
          placeholder="Search transcript..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 rounded bg-white/10 text-white text-xs placeholder-white/30 border border-white/10 focus:outline-none focus:border-white/30"
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {transcripts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">Transcript will appear here as people speak.</p>
          </div>
        )}

        {filtered.map((chunk) => {
          if (!speakerColors[chunk.speakerLabel]) {
            speakerColors[chunk.speakerLabel] = colors[colorIdx % colors.length];
            colorIdx++;
          }
          const color = speakerColors[chunk.speakerLabel];

          return (
            <div
              key={chunk.id}
              className={`group ${chunk.isFlagged ? 'pl-2 border-l-2 border-[#C9A84C]' : ''}`}
            >
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`text-[10px] md:text-xs font-semibold ${color}`}>{chunk.speakerLabel}</span>
                <span className="text-white/30 text-xs">{formatTimestamp(chunk.timestampStart)}</span>
                {chunk.isFlagged && (
                  <span className="text-[#C9A84C] text-xs">&#x2691;</span>
                )}
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{chunk.content}</p>
            </div>
          );
        })}
      </div>

      {!autoScroll && transcripts.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
          className="mx-3 mb-3 py-1.5 rounded bg-white/10 text-white/70 text-xs hover:bg-white/15 transition-colors"
        >
          &#x2193; Scroll to latest
        </button>
      )}
    </div>
  );
}
