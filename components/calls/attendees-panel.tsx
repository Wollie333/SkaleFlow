'use client';

import { useState } from 'react';
import type { Participant } from './call-room';

interface AttendeesPanelProps {
  participants: Participant[];
  isHost: boolean;
  roomCode: string;
}

export function AttendeesPanel({ participants, isHost, roomCode }: AttendeesPanelProps) {
  const [copied, setCopied] = useState(false);

  const inCall = participants.filter(p => p.status === 'in_call');
  const waiting = participants.filter(p => p.status === 'waiting');
  const invited = participants.filter(p => p.status === 'invited');

  const copyLink = () => {
    const url = `${window.location.origin}/call/${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white text-sm font-semibold">Attendees ({inCall.length})</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Waiting room */}
        {waiting.length > 0 && (
          <div>
            <h4 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Waiting Room</h4>
            <div className="space-y-1">
              {waiting.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10">
                  <span className="text-white text-sm">{p.name}</span>
                  {isHost && (
                    <div className="flex gap-1">
                      <button className="px-2 py-1 text-xs rounded bg-[#1E6B63] text-white hover:bg-[#1E6B63]/80">
                        Admit
                      </button>
                      <button className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In call */}
        {inCall.length > 0 && (
          <div>
            <h4 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">In Call</h4>
            <div className="space-y-1">
              {inCall.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                  <div className="w-7 h-7 rounded-full bg-[#1E6B63]/30 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm truncate block">{p.name}</span>
                    <span className="text-white/40 text-xs capitalize">{p.role.replace('_', ' ')}</span>
                  </div>
                  {p.isMuted && (
                    <span className="text-red-400/60 text-xs">Muted</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invited */}
        {invited.length > 0 && (
          <div>
            <h4 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Invited</h4>
            <div className="space-y-1">
              {invited.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/50 text-xs font-medium">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-white/50 text-sm">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite link */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={copyLink}
          className="w-full py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15 transition-colors"
        >
          {copied ? 'Link Copied!' : 'Copy Invite Link'}
        </button>
      </div>
    </div>
  );
}
