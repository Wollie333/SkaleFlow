'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoPanel } from './video-panel';
import { AttendeesPanel } from './attendees-panel';
import { CopilotPanel } from './copilot-panel';
import { TranscriptPanel } from './transcript-panel';
import { ControlsBar } from './controls-bar';
import { CallSignaling } from '@/lib/calls/signaling';
import { CallRecorder, uploadRecording } from '@/lib/calls/recording';
import { TranscriptionManager } from '@/lib/calls/transcription';

interface CallRoomProps {
  roomCode: string;
  callId: string;
  callTitle?: string;
  organizationId?: string;
  userId?: string; // null for guests
  isHost: boolean;
  guestName?: string;
  guestEmail?: string;
  showOpenInTab?: boolean;
}

export type PanelView = 'copilot' | 'transcript' | 'attendees' | 'none';

export interface Participant {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
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

export type RecordingState = 'idle' | 'recording' | 'stopping';

export function CallRoom({
  roomCode, callId, callTitle, organizationId, userId, isHost, guestName, guestEmail, showOpenInTab
}: CallRoomProps) {
  const [activePanel, setActivePanel] = useState<PanelView>(isHost ? 'copilot' : 'attendees');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptChunk[]>([]);
  const [guidance, setGuidance] = useState<GuidanceItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [isRecordingRemote, setIsRecordingRemote] = useState(false); // non-host: remote recording indicator
  const [callActive, setCallActive] = useState(false);
  const [callElapsed, setCallElapsed] = useState(0);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const signalingRef = useRef<CallSignaling | null>(null);
  const recorderRef = useRef<CallRecorder | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionRef = useRef<TranscriptionManager | null>(null);
  const transcriptCounterRef = useRef(0);

  const displayName = callTitle || `Room: ${roomCode}`;
  const isRecording = recordingState === 'recording' || isRecordingRemote;

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

  // Register self as participant on mount
  useEffect(() => {
    const registerParticipant = async () => {
      try {
        const res = await fetch(`/api/calls/${roomCode}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId || undefined,
            guestName: guestName || undefined,
            guestEmail: guestEmail || undefined,
            role: isHost ? 'host' : (userId ? 'team_member' : 'guest'),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          participantIdRef.current = data.id;
        }
      } catch (err) {
        console.error('Failed to register participant:', err);
      }
    };

    registerParticipant();
  }, [roomCode, userId, guestName, guestEmail, isHost]);

  // Poll participants every 5s
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`/api/calls/${roomCode}/participants`);
        if (!res.ok) return;
        const data = await res.json();
        const mapped: Participant[] = data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          userId: p.user_id as string | null,
          name: (p.name as string) || (p.guest_name as string) || 'Unknown',
          email: (p.email as string | null) || (p.guest_email as string | null),
          avatarUrl: (p.avatar_url as string | null) || null,
          role: p.role as Participant['role'],
          status: p.status as Participant['status'],
          isMuted: false,
          isCameraOff: false,
        }));
        setParticipants(mapped);
      } catch {
        // Ignore polling errors
      }
    };

    fetchParticipants();
    pollRef.current = setInterval(fetchParticipants, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomCode]);

  // Signaling connection
  useEffect(() => {
    if (!participantIdRef.current) return;

    const signaling = new CallSignaling(roomCode, participantIdRef.current);
    signalingRef.current = signaling;

    // Handle recording signals (non-host side)
    signaling.on('recording-started', () => {
      if (!isHost) {
        setIsRecordingRemote(true);
      }
    });

    signaling.on('recording-stopped', () => {
      if (!isHost) {
        setIsRecordingRemote(false);
      }
    });

    // Handle admit signal (guest side — refresh status)
    signaling.on('admit-participant', (msg) => {
      if (msg.payload.participantId === participantIdRef.current) {
        // Participant was admitted — no further action needed, polling will pick up status
      }
    });

    signaling.connect().catch(err => {
      console.error('Signaling connection failed:', err);
    });

    return () => {
      signaling.disconnect();
      signalingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, isHost, participantIdRef.current]);

  // Start transcription when call is active (host only)
  useEffect(() => {
    if (!callActive || !isHost) return;

    const manager = new TranscriptionManager('Host');
    transcriptionRef.current = manager;

    // Track interim transcript ID so we can update in-place
    let interimId: string | null = null;

    manager.start((result) => {
      if (!result.text.trim()) return;

      if (result.isFinal) {
        const finalId = `t-${++transcriptCounterRef.current}`;
        setTranscripts(prev => {
          // Remove any interim entry, add final
          const cleaned = interimId ? prev.filter(t => t.id !== interimId) : prev;
          return [...cleaned, {
            id: finalId,
            speakerLabel: result.speakerLabel,
            content: result.text,
            timestampStart: callElapsed,
            isFlagged: false,
          }];
        });
        interimId = null;
      } else {
        // Interim result — update or append
        if (!interimId) {
          interimId = `t-interim-${++transcriptCounterRef.current}`;
        }
        const currentInterimId = interimId;
        setTranscripts(prev => {
          const idx = prev.findIndex(t => t.id === currentInterimId);
          const chunk: TranscriptChunk = {
            id: currentInterimId,
            speakerLabel: result.speakerLabel,
            content: result.text,
            timestampStart: callElapsed,
            isFlagged: false,
          };
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = chunk;
            return updated;
          }
          return [...prev, chunk];
        });
      }
    }, localStreamRef.current || undefined);

    return () => {
      manager.stop();
      transcriptionRef.current = null;
    };
    // Only re-run when callActive or isHost change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callActive, isHost]);

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

  // Recording: admin clicks → starts immediately, broadcasts indicator
  const toggleRecording = useCallback(async () => {
    if (!isHost) return;

    if (recordingState === 'idle') {
      // Start recording
      const stream = localStreamRef.current;
      if (!stream) return;

      const recorder = new CallRecorder({
        onStop: async (blob) => {
          // Upload recording
          if (organizationId && callId) {
            await uploadRecording(organizationId, callId, blob);
          }
        },
      });
      recorderRef.current = recorder;
      recorder.start(stream);
      setRecordingState('recording');

      // Broadcast recording started to all participants
      signalingRef.current?.send('recording-started', {});
    } else if (recordingState === 'recording') {
      // Stop recording
      setRecordingState('stopping');
      const recorder = recorderRef.current;
      if (recorder) {
        await recorder.stop();
        recorderRef.current = null;
      }
      setRecordingState('idle');

      // Broadcast recording stopped
      signalingRef.current?.send('recording-stopped', {});
    }
  }, [isHost, recordingState, organizationId, callId]);

  const flagTranscript = useCallback(() => {
    setTranscripts(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1], isFlagged: true };
      updated[updated.length - 1] = last;
      return updated;
    });
  }, []);

  // Admit / Deny handlers
  const admitParticipant = useCallback(async (pId: string) => {
    try {
      await fetch(`/api/calls/${roomCode}/participants/${pId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_call' }),
      });
      // Signal the admitted participant
      signalingRef.current?.send('admit-participant', { participantId: pId });
      // Update local state immediately
      setParticipants(prev =>
        prev.map(p => p.id === pId ? { ...p, status: 'in_call' } : p)
      );
    } catch (err) {
      console.error('Failed to admit participant:', err);
    }
  }, [roomCode]);

  const denyParticipant = useCallback(async (pId: string) => {
    try {
      await fetch(`/api/calls/${roomCode}/participants/${pId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'denied' }),
      });
      setParticipants(prev => prev.filter(p => p.id !== pId));
    } catch (err) {
      console.error('Failed to deny participant:', err);
    }
  }, [roomCode]);

  const kickParticipant = useCallback(async (pId: string) => {
    try {
      await fetch(`/api/calls/${roomCode}/participants/${pId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'denied' }),
      });
      // Remove from local state immediately
      setParticipants(prev => prev.filter(p => p.id !== pId));
    } catch (err) {
      console.error('Failed to kick participant:', err);
    }
  }, [roomCode]);

  const endCall = useCallback(async () => {
    // Stop transcription
    if (transcriptionRef.current) {
      transcriptionRef.current.stop();
      transcriptionRef.current = null;
    }

    // Stop recording if active
    if (recorderRef.current) {
      await recorderRef.current.stop();
      recorderRef.current = null;
      setRecordingState('idle');
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    signalingRef.current?.disconnect();
    setCallActive(false);

    // Mark self as left
    if (participantIdRef.current) {
      try {
        await fetch(`/api/calls/${roomCode}/participants/${participantIdRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'left' }),
        });
      } catch {
        // Ignore
      }
    }

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
          <span className="text-white/80 text-sm font-medium">{displayName}</span>
          {callActive && (
            <span className="flex items-center gap-1.5 text-red-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatTime(callElapsed)}
            </span>
          )}
          {/* Recording indicator — visible to all participants */}
          {isRecording && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium ml-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording
            </span>
          )}
          {recordingState === 'stopping' && isHost && (
            <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium ml-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(isHost ? ['attendees', 'copilot', 'transcript'] : ['attendees']).map((panel) => (
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

          {/* Open in new tab button — only in dashboard layout */}
          {showOpenInTab && (
            <button
              onClick={() => window.open(`/call-room/${roomCode}`, '_blank')}
              className="px-2 py-1.5 rounded text-white/50 hover:text-white/80 transition-colors"
              title="Open in new tab (full screen)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
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
                hostUserId={userId}
                roomCode={roomCode}
                onAdmit={admitParticipant}
                onDeny={denyParticipant}
                onKick={kickParticipant}
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
