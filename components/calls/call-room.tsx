'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoPanel } from './video-panel';
import { AttendeesPanel } from './attendees-panel';
import { CopilotPanel } from './copilot-panel';
import { TranscriptPanel } from './transcript-panel';
import { ControlsBar } from './controls-bar';

interface CallRoomProps {
  roomCode: string;
  callId: string;
  userId?: string; // null for guests
  isHost: boolean;
  guestName?: string;
  guestEmail?: string;
}

export type PanelView = 'copilot' | 'transcript' | 'attendees' | 'none';

export interface Participant {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  role: 'host' | 'team_member' | 'guest';
  status: 'invited' | 'waiting' | 'admitted' | 'in_call' | 'left' | 'denied';
  stream?: MediaStream;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

export interface TranscriptChunk {
  id: string;
  speakerLabel: string;
  content: string;
  timestampStart: number;
  isFlagged: boolean;
  flagNote?: string;
}

export interface GuidanceItem {
  id: string;
  guidanceType: string;
  content: string;
  frameworkPhase?: string;
  frameworkStep?: string;
  wasUsed: boolean;
  wasDismissed: boolean;
}

export function CallRoom({ roomCode, callId, userId, isHost, guestName, guestEmail }: CallRoomProps) {
  const [activePanel, setActivePanel] = useState<PanelView>('copilot');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptChunk[]>([]);
  const [guidance, setGuidance] = useState<GuidanceItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callElapsed, setCallElapsed] = useState(0);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Call timer
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callActive]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize local media
  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      setCallActive(true);
    } catch (err) {
      console.error('Failed to access media devices:', err);
      // Try audio-only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setIsCameraOff(true);
        setCallActive(true);
      } catch {
        console.error('Failed to access any media devices');
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCameraOff(prev => !prev);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      return;
    }
    try {
      await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);
    } catch {
      // User cancelled
    }
  }, [isScreenSharing]);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const flagTranscript = useCallback(() => {
    // Flag the most recent transcript
    setTranscripts(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1], isFlagged: true };
      updated[updated.length - 1] = last;
      return updated;
    });
  }, []);

  const endCall = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCallActive(false);

    // Update call status
    try {
      await fetch(`/api/calls/${roomCode}/end`, { method: 'POST' });
    } catch {
      // Ignore - we're leaving anyway
    }

    window.location.href = `/calls/${roomCode}/summary`;
  }, [roomCode]);

  return (
    <div className="h-screen flex flex-col bg-[#0F1F1D]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0F1F1D] border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-white/80 text-sm font-medium">Room: {roomCode}</span>
          {callActive && (
            <span className="flex items-center gap-1.5 text-red-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatTime(callElapsed)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {['attendees', 'copilot', 'transcript'].map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(activePanel === panel ? 'none' : panel as PanelView)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activePanel === panel
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {panel.charAt(0).toUpperCase() + panel.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Video Panel (always visible, takes remaining space) */}
        <div className="flex-1 min-w-0">
          <VideoPanel
            localStream={localStreamRef.current}
            participants={participants}
            isCameraOff={isCameraOff}
            isScreenSharing={isScreenSharing}
            callActive={callActive}
            onStartMedia={startMedia}
          />
        </div>

        {/* Side Panel (collapsible) */}
        {activePanel !== 'none' && (
          <div className="w-80 border-l border-white/10 flex flex-col bg-[#0F1F1D]">
            {activePanel === 'attendees' && (
              <AttendeesPanel
                participants={participants}
                isHost={isHost}
                roomCode={roomCode}
              />
            )}
            {activePanel === 'copilot' && (
              <CopilotPanel
                guidance={guidance}
                callActive={callActive}
              />
            )}
            {activePanel === 'transcript' && (
              <TranscriptPanel
                transcripts={transcripts}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <ControlsBar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        callActive={callActive}
        isHost={isHost}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleRecording={toggleRecording}
        onFlag={flagTranscript}
        onEndCall={endCall}
      />
    </div>
  );
}
