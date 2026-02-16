'use client';

import { useRef, useEffect } from 'react';
import type { Participant } from './call-room';

interface VideoPanelProps {
  localStream: MediaStream | null;
  participants: Participant[];
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callActive: boolean;
  onStartMedia: () => void;
}

export function VideoPanel({ localStream, participants, isCameraOff, callActive, onStartMedia }: VideoPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const activeParticipants = participants.filter(p => p.status === 'in_call');

  if (!callActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-medium mb-2">Ready to join?</h2>
          <p className="text-white/50 text-sm mb-6">Click below to enable your camera and microphone</p>
          <button
            onClick={onStartMedia}
            className="px-6 py-3 rounded-lg bg-[#1E6B63] hover:bg-[#1E6B63]/80 text-white font-medium transition-colors"
          >
            Join Call
          </button>
        </div>
      </div>
    );
  }

  // Grid layout based on participant count
  const totalStreams = 1 + activeParticipants.length; // local + remote
  const gridClass = totalStreams <= 1
    ? 'grid-cols-1'
    : totalStreams <= 2
    ? 'grid-cols-2'
    : totalStreams <= 4
    ? 'grid-cols-2 grid-rows-2'
    : 'grid-cols-3 grid-rows-2';

  return (
    <div className={`h-full p-3 grid gap-3 ${gridClass}`}>
      {/* Local video */}
      <div className="relative bg-[#1a1a2e] rounded-xl overflow-hidden">
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
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded text-white text-xs">
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
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded text-white text-xs flex items-center gap-1.5">
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
