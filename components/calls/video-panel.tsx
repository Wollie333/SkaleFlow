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
  onRetryMedia: () => void;
  mediaError?: string | null;
}

export function VideoPanel({ localStream, participants, localUserId, localParticipantId, isCameraOff, callActive, isWaiting, displayName, onJoinCall, onRetryMedia, mediaError }: VideoPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Attach stream to the active call video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    } else if (localVideoRef.current && !localStream) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  // Attach stream to the pre-call preview video element
  useEffect(() => {
    if (previewVideoRef.current && localStream) {
      previewVideoRef.current.srcObject = localStream;
      previewVideoRef.current.play().catch(() => {});
    } else if (previewVideoRef.current && !localStream) {
      previewVideoRef.current.srcObject = null;
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

  // Pre-call lobby: show camera preview + Join Call button
  if (!callActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center max-w-lg px-4 w-full">
          {/* Camera preview */}
          {localStream && !isCameraOff ? (
            <div className="relative bg-[#1a1a2e] rounded-xl overflow-hidden mx-auto mb-6 aspect-video max-w-sm">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-[10px]">
                Camera preview
              </div>
            </div>
          ) : localStream && isCameraOff ? (
            <div className="relative bg-[#1a1a2e] rounded-xl overflow-hidden mx-auto mb-6 aspect-video max-w-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#1E6B63]/30 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-white/40 text-xs">Audio only — camera unavailable</p>
              </div>
            </div>
          ) : mediaError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl mx-auto mb-6 p-6 max-w-sm">
              <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-red-300/80 text-sm">{mediaError}</p>
            </div>
          ) : (
            <div className="bg-[#1a1a2e] rounded-xl mx-auto mb-6 aspect-video max-w-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-teal/40 border-t-teal rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/40 text-xs">Accessing camera &amp; microphone...</p>
              </div>
            </div>
          )}

          <h2 className="text-white text-lg font-medium mb-2">
            {displayName || 'Call Room'}
          </h2>

          {localStream ? (
            <>
              <p className="text-white/50 text-sm mb-4">
                {isCameraOff ? 'Microphone is ready (camera could not start)' : 'Your camera and mic are ready'}
              </p>
              <div className="flex flex-col gap-2 items-center">
                <button
                  onClick={onJoinCall}
                  className="px-6 py-3 rounded-lg bg-[#1E6B63] hover:bg-[#1E6B63]/80 text-white font-medium text-base transition-colors"
                >
                  {isCameraOff ? 'Join with Audio Only' : 'Join Call'}
                </button>
                {isCameraOff && (
                  <button
                    onClick={onRetryMedia}
                    className="text-white/40 hover:text-white/60 text-xs underline transition-colors"
                  >
                    Retry camera
                  </button>
                )}
              </div>
            </>
          ) : mediaError ? (
            <button
              onClick={onRetryMedia}
              className="px-6 py-3 rounded-lg bg-[#1E6B63] hover:bg-[#1E6B63]/80 text-white font-medium text-base transition-colors"
            >
              Retry
            </button>
          ) : (
            <p className="text-white/40 text-sm">Setting up devices...</p>
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
