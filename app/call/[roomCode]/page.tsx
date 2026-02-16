'use client';

import { useState, use } from 'react';
import { CallRoom } from '@/components/calls/call-room';

export default function GuestCallRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const [joined, setJoined] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [consent, setConsent] = useState(false);

  if (!joined) {
    return (
      <div className="min-h-screen bg-[#0F1F1D] flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl">
          <h1 className="text-xl font-serif font-bold text-[#2A2A28] mb-2">Join Call</h1>
          <p className="text-sm text-[#8A8A7A] mb-6">
            Enter your details to join the call room <strong>{roomCode}</strong>.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2A2A28] mb-1">Your Name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                placeholder="Full Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2A2A28] mb-1">Email</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B63]/30 focus:border-[#1E6B63]"
                placeholder="your@email.com"
                required
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#1E6B63] focus:ring-[#1E6B63]"
              />
              <span className="text-xs text-[#8A8A7A]">
                I consent to this call being recorded and transcribed for quality and coaching purposes.
              </span>
            </label>

            <button
              onClick={() => {
                if (guestName && guestEmail && consent) setJoined(true);
              }}
              disabled={!guestName || !guestEmail || !consent}
              className="w-full py-3 rounded-lg bg-[#1E6B63] text-white font-medium text-sm hover:bg-[#1E6B63]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enter Waiting Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CallRoom
      roomCode={roomCode}
      callId=""
      isHost={false}
      guestName={guestName}
      guestEmail={guestEmail}
    />
  );
}
