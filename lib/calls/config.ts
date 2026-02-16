// Call system configuration — environment-based switching for dev/prod

export const CALL_CONFIG = {
  // STUN/TURN servers
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(process.env.NEXT_PUBLIC_TURN_SERVER_URL
      ? [
          {
            urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
          },
        ]
      : []),
  ],

  // Transcription provider: 'browser' (Web Speech API) or 'whisper' (self-hosted)
  transcriptionProvider: (process.env.NEXT_PUBLIC_TRANSCRIPTION_PROVIDER || 'browser') as
    | 'browser'
    | 'whisper',

  // AI copilot provider: 'mock' (template-based) or 'live' (Claude API)
  copilotProvider: (process.env.NEXT_PUBLIC_COPILOT_PROVIDER || 'mock') as 'mock' | 'live',

  // Whisper endpoint (prod only)
  whisperEndpoint: process.env.WHISPER_ENDPOINT || '',

  // Max participants in mesh topology
  maxParticipants: 6,

  // Video quality tiers
  videoConstraints: {
    high: { width: 1280, height: 720, frameRate: 30 },
    medium: { width: 640, height: 480, frameRate: 24 },
    low: { width: 320, height: 240, frameRate: 15 },
  },

  // Recording settings
  recording: {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 2_500_000,
  },

  // Transcript processing
  transcriptBatchMs: 2000, // Send transcript chunks every 2s
  aiProcessingDebounceMs: 3000, // Debounce AI processing after last speech
};

/**
 * Generate a unique room code (8 chars, URL-safe)
 */
export function generateRoomCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // No ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
