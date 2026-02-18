'use client';

interface ControlsBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  callActive: boolean;
  isHost: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onFlag: () => void;
  onEndCall: () => void;
  onToggleOffers?: () => void;
  isOffersOpen?: boolean;
  onOpenSettings?: () => void;
  onToggleCaptions?: () => void;
  isCaptionsOn?: boolean;
}

export function ControlsBar({
  isMuted, isCameraOff, isScreenSharing, isRecording, callActive,
  isHost, onToggleMute, onToggleCamera, onToggleScreenShare,
  onToggleRecording, onFlag, onEndCall, onToggleOffers, isOffersOpen, onOpenSettings,
  onToggleCaptions, isCaptionsOn,
}: ControlsBarProps) {
  if (!callActive) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-3 px-2 md:px-4 py-2 md:py-3 bg-[#0F1F1D] border-t border-white/10">
      {/* Mic toggle */}
      <button
        onClick={onToggleMute}
        className={`p-2 md:p-3 rounded-full transition-colors ${
          isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Camera toggle */}
      <button
        onClick={onToggleCamera}
        className={`p-2 md:p-3 rounded-full transition-colors ${
          isCameraOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
      >
        {isCameraOff ? (
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        )}
      </button>

      {/* Screen share — hidden on mobile (not supported on phones) */}
      <button
        onClick={onToggleScreenShare}
        className={`hidden md:flex p-2 md:p-3 rounded-full transition-colors ${
          isScreenSharing ? 'bg-[#1E6B63] text-white' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      </button>

      {/* Captions toggle */}
      {onToggleCaptions && (
        <button
          onClick={onToggleCaptions}
          className={`p-2 md:p-3 rounded-full transition-colors ${
            isCaptionsOn ? 'bg-[#1E6B63] text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
          }`}
          title={isCaptionsOn ? 'Hide captions' : 'Show captions'}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={2} />
            <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">CC</text>
          </svg>
        </button>
      )}

      {/* Settings */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="p-2 md:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="Device settings"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Record (host only) */}
      {isHost && (
        <button
          onClick={onToggleRecording}
          className={`p-2 md:p-3 rounded-full transition-colors ${
            isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill={isRecording ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            {isRecording && <circle cx="12" cy="12" r="5" fill="currentColor" />}
          </svg>
        </button>
      )}

      {/* Offers (host only) */}
      {isHost && onToggleOffers && (
        <button
          onClick={onToggleOffers}
          className={`p-2 md:p-3 rounded-full transition-colors ${
            isOffersOpen ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title="Present offers"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Flag moment */}
      <button
        onClick={onFlag}
        className="p-2 md:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        title="Flag this moment"
      >
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.208.682l3.454-.864A.75.75 0 0022.5 14.25V3.75a.75.75 0 00-1.032-.71l-3.454.865a9 9 0 01-6.208-.682l-.108-.054a9 9 0 00-6.208-.682L3 3.75" />
        </svg>
      </button>

      <div className="w-px h-6 md:h-8 bg-white/20 mx-1" />

      {/* End call */}
      <button
        onClick={onEndCall}
        className="px-3 md:px-5 py-2 md:py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-medium transition-colors"
      >
        End Call
      </button>
    </div>
  );
}
