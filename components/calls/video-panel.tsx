'use client';

import { useRef, useEffect } from 'react';
import type { Participant } from './call-room';

interface VideoPanelProps {
  localStream: MediaStream | null;
  participants: Participant[];
  localUserId: string | null;
  localParticipantId: string | null;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callActive: boolean;
  isWaiting?: boolean;
  displayName?: string;
  onJoinCall: () => void;
  mediaError?: string | null;
  isHost?: boolean;
}

export function VideoPanel({ localStream, participants, localUserId, localParticipantId, isCameraOff, callActive, isWaiting, displayName, onJoinCall, mediaError, isHost }: VideoPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Attach stream to the active call video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    } else if (localVideoRef.current && !localStream) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  // Exclude the local user from remote participant tiles to prevent duplicate
  const activeParticipants = participants.filter(
    p => p.status === 'in_call' && p.id !== localParticipantId && p.userId !== localUserId
  );

  // Waiting room screen — shown to guests before host admits them
  if (isWaiting) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-cream-warm/5 flex items-center justify-center mx-auto mb-4 md:mb-6">
            <svg className="w-8 h-8 md:w-12 md:h-12 text-teal/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-medium mb-2">Waiting Room</h2>
          <p className="text-white/50 text-xs md:text-sm mb-2">
            You&apos;re in the waiting room for <strong className="text-white/70">{displayName || 'this call'}</strong>.
          </p>
          <p className="text-white/40 text-xs">The host will let you in shortly...</p>
          <div className="mt-6 flex justify-center">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-call lobby: camera icon + title + join button (Google Meet style)
  if (!callActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center max-w-sm px-4">
          {/* Camera icon */}
          <div className="w-20 h-20 rounded-full bg-cream-warm/5 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-teal/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          <h2 className="text-white text-xl font-medium mb-6">
            {displayName || 'Call Room'}
          </h2>

          {/* Join button */}
          <button
            onClick={onJoinCall}
            className="px-8 py-3 rounded-lg bg-[#1E6B63] hover:bg-[#1E6B63]/80 text-white font-medium text-base transition-colors"
          >
            {isHost ? 'Join as Host' : 'Join Call'}
          </button>

          {/* Error message + Try Again */}
          {mediaError && (
            <div className="mt-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-300/80 text-sm">{mediaError}</p>
              </div>
              <button
                onClick={onJoinCall}
                className="mt-3 px-6 py-2.5 rounded-lg bg-cream-warm/10 hover:bg-cream-warm/20 text-white text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active call: grid layout
  const totalStreams = 1 + activeParticipants.length;
  const gridClass = totalStreams <= 1
    ? 'grid-cols-1'
    : totalStreams <= 2
    ? 'grid-cols-1 md:grid-cols-2'
    : totalStreams <= 4
    ? 'grid-cols-2 grid-rows-2'
    : 'grid-cols-2 md:grid-cols-3 grid-rows-2';

  return (
    <div className={`h-full p-2 md:p-3 grid gap-2 md:gap-3 ${gridClass}`}>
      {/* Local video */}
      <div className="relative bg-[#1a1a2e] rounded-xl overflow-hidden min-h-[200px]">
        {isCameraOff ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#1E6B63]/30 flex items-center justify-center">
              <span className="text-white text-xl font-semibold">You</span>
            </div>
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 px-2 py-1 bg-black/50 rounded text-white text-[10px] md:text-xs">
          You
        </div>
      </div>

      {/* Remote participants */}
      {activeParticipants.map((p) => (
        <div key={p.id} className="relative bg-[#1a1a2e] rounded-xl overflow-hidden">
          {p.isCameraOff || !p.stream ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              ref={(el) => {
                if (el && p.stream) el.srcObject = p.stream;
              }}
            />
          )}
          <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 px-2 py-1 bg-black/50 rounded text-white text-[10px] md:text-xs flex items-center gap-1.5">
            {p.name}
            {p.isMuted && (
              <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
