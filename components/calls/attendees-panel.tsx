'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Participant } from './call-room';

interface AttendeesPanelProps {
  participants: Participant[];
  isHost: boolean;
  hostUserId?: string;
  roomCode: string;
  onAdmit?: (participantId: string) => void;
  onDeny?: (participantId: string) => void;
  onKick?: (participantId: string) => void;
}

function Avatar({ participant, size = 'md' }: { participant: Participant; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const initial = participant.name.charAt(0).toUpperCase();

  if (participant.avatarUrl) {
    return (
      <Image
        src={participant.avatarUrl}
        alt={participant.name}
        width={size === 'sm' ? 28 : 32}
        height={size === 'sm' ? 28 : 32}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${dim} rounded-full bg-[#1E6B63]/30 flex items-center justify-center flex-shrink-0`}>
      <span className={`text-white ${textSize} font-medium`}>{initial}</span>
    </div>
  );
}

export function AttendeesPanel({ participants, isHost, hostUserId, roomCode, onAdmit, onDeny, onKick }: AttendeesPanelProps) {
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
      <div className="px-3 md:px-4 py-3 border-b border-white/10">
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
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar participant={p} size="sm" />
                    <span className="text-white text-sm truncate">{p.name}</span>
                  </div>
                  {isHost && (
                    <div className="flex gap-1.5 flex-shrink-0 ml-2">
                      <button
                        onClick={() => onAdmit?.(p.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-[#1E6B63] text-white hover:bg-[#1E6B63]/80 active:bg-[#1E6B63]/70 transition-colors"
                      >
                        Admit
                      </button>
                      <button
                        onClick={() => onDeny?.(p.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40 transition-colors"
                      >
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
              {inCall.map(p => {
                const isSelf = p.userId === hostUserId && isHost;
                return (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-cream-warm/5 group">
                    <Avatar participant={p} />
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm truncate block">
                        {p.name}{p.role === 'host' ? ' (Host)' : ''}
                      </span>
                      <span className="text-white/40 text-xs capitalize">{p.role.replace('_', ' ')}</span>
                    </div>
                    {p.isMuted && (
                      <span className="text-red-400/60 text-xs">Muted</span>
                    )}
                    {isHost && !isSelf && p.role !== 'host' && (
                      <button
                        onClick={() => onKick?.(p.id)}
                        className="md:opacity-0 md:group-hover:opacity-100 px-2.5 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40 transition-all"
                        title="Remove from call"
                      >
                        Kick
                      </button>
                    )}
                  </div>
                );
              })}
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
                  <Avatar participant={p} size="sm" />
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
          className="w-full py-2 rounded-lg bg-cream-warm/10 text-white text-sm hover:bg-cream-warm/15 transition-colors"
        >
          {copied ? 'Link Copied!' : 'Copy Invite Link'}
        </button>
      </div>
    </div>
  );
}
