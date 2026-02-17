'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoPanel } from './video-panel';
import { AttendeesPanel } from './attendees-panel';
import { CopilotPanel } from './copilot-panel';
import { TranscriptPanel } from './transcript-panel';
import { ControlsBar } from './controls-bar';
import { OffersPanel, type Offer, type OfferResponseMap } from './offers-panel';
import { OfferOverlay } from './offer-overlay';
import { DeviceSettings } from './device-settings';
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

export type PanelView = 'copilot' | 'transcript' | 'attendees' | 'offers' | 'insights' | 'none';

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
  const [activePanel, setActivePanel] = useState<PanelView>(isHost ? 'insights' : 'attendees');
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
  const [localStatus, setLocalStatus] = useState<string>(isHost ? 'in_call' : 'waiting');

  const [isSaving, setIsSaving] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  // Offer presentation state
  const [presentedOfferId, setPresentedOfferId] = useState<string | null>(null);
  const [presentedOffer, setPresentedOffer] = useState<{
    id: string; name: string; description: string | null; tier: string | null;
    price_display: string | null; price_value: number | null; currency: string;
    billing_frequency: string | null; deliverables: string[]; value_propositions: string[];
  } | null>(null);
  const [offerResponses, setOfferResponses] = useState<OfferResponseMap>({});
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

  // Register self as participant on mount (guard against double-fire from strict mode)
  useEffect(() => {
    if (participantIdRef.current) return; // Already registered

    let cancelled = false;
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
        if (res.ok && !cancelled) {
          const data = await res.json();
          participantIdRef.current = data.id;
        }
      } catch (err) {
        console.error('Failed to register participant:', err);
      }
    };

    registerParticipant();
    return () => { cancelled = true; };
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

        // Update local user status from server (for waiting room tracking)
        if (participantIdRef.current) {
          const me = mapped.find(p => p.id === participantIdRef.current);
          if (me && me.status === 'in_call') {
            setLocalStatus('in_call');
          }
        }
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

    // Handle admit signal (guest side — transition from waiting to in_call)
    signaling.on('admit-participant', (msg) => {
      if (msg.payload.participantId === participantIdRef.current) {
        setLocalStatus('in_call');
      }
    });

    // Handle offer presented (guest/team side — show overlay)
    signaling.on('offer-presented', (msg) => {
      if (!isHost) {
        const offer = msg.payload.offer as typeof presentedOffer;
        if (offer) setPresentedOffer(offer);
      }
    });

    // Handle offer dismissed (guest/team side — hide overlay)
    signaling.on('offer-dismissed', () => {
      if (!isHost) {
        setPresentedOffer(null);
      }
    });

    // Handle offer accepted (host side — update response map)
    signaling.on('offer-accepted', (msg) => {
      if (isHost) {
        const offerId = msg.payload.offerId as string;
        const pName = (msg.payload.guestName as string) || 'Attendee';
        setOfferResponses(prev => ({
          ...prev,
          [offerId]: {
            ...(prev[offerId] || {}),
            [msg.senderId]: { participantName: pName, status: 'accepted' },
          },
        }));
      }
    });

    // Handle offer declined (host side — update response map with reason)
    signaling.on('offer-declined', (msg) => {
      if (isHost) {
        const offerId = msg.payload.offerId as string;
        const pName = (msg.payload.guestName as string) || 'Attendee';
        const reason = (msg.payload.reason as string) || '';
        setOfferResponses(prev => ({
          ...prev,
          [offerId]: {
            ...(prev[offerId] || {}),
            [msg.senderId]: { participantName: pName, status: 'declined', reason },
          },
        }));
      }
    });

    // Handle offer minimized (host side — update response map)
    signaling.on('offer-minimized', (msg) => {
      if (isHost) {
        const offerId = msg.payload.offerId as string;
        const pName = (msg.payload.guestName as string) || 'Attendee';
        setOfferResponses(prev => ({
          ...prev,
          [offerId]: {
            ...(prev[offerId] || {}),
            [msg.senderId]: { participantName: pName, status: 'minimized' },
          },
        }));
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

  // Save a final transcript chunk to the database
  const saveTranscriptToDb = useCallback(async (speakerLabel: string, content: string, timestampStart: number) => {
    if (!participantIdRef.current) return;
    try {
      await fetch(`/api/calls/${roomCode}/transcripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participantIdRef.current,
          speakerLabel,
          content,
          timestampStart,
          confidence: 1.0,
        }),
      });
    } catch {
      // Non-blocking — don't fail the call if transcript save fails
    }
  }, [roomCode]);

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
        const finalText = result.text;
        setTranscripts(prev => {
          // Remove interim entry
          const cleaned = interimId ? prev.filter(t => t.id !== interimId) : prev;
          // Deduplicate: skip if the last entry has identical content
          const last = cleaned[cleaned.length - 1];
          if (last && last.content === finalText && last.speakerLabel === result.speakerLabel) {
            return cleaned;
          }
          return [...cleaned, {
            id: finalId,
            speakerLabel: result.speakerLabel,
            content: finalText,
            timestampStart: callElapsed,
            isFlagged: false,
          }];
        });
        interimId = null;

        // Persist final transcript to database
        saveTranscriptToDb(result.speakerLabel, finalText, callElapsed);
      } else {
        // Interim result — update in-place (single interim slot)
        if (!interimId) {
          interimId = `t-interim-${++transcriptCounterRef.current}`;
        }
        const currentInterimId = interimId;
        setTranscripts(prev => {
          const chunk: TranscriptChunk = {
            id: currentInterimId,
            speakerLabel: result.speakerLabel,
            content: result.text,
            timestampStart: callElapsed,
            isFlagged: false,
          };
          const idx = prev.findIndex(t => t.id === currentInterimId);
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

  // Switch media devices
  const handleDeviceChange = useCallback(async (audioDeviceId: string | null, videoDeviceId: string | null) => {
    try {
      const constraints: MediaStreamConstraints = {};
      if (audioDeviceId) constraints.audio = { deviceId: { exact: audioDeviceId } };
      else constraints.audio = true;
      if (videoDeviceId) constraints.video = { deviceId: { exact: videoDeviceId } };
      else constraints.video = true;

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Stop old tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      localStreamRef.current = newStream;
      // Force re-render by toggling a state
      setIsCameraOff(false);
      setIsMuted(false);
    } catch (err) {
      console.error('Failed to switch devices:', err);
    }
  }, []);

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
    // Also flag the most recent transcript in the database
    // (the flag will be picked up by the post-call summary pipeline)
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

  // Present offer to selected attendees (host side)
  const presentOffer = useCallback((offer: Offer, targetParticipantIds: string[]) => {
    const offerData = {
      id: offer.id,
      name: offer.name,
      description: offer.description,
      tier: offer.tier,
      price_display: offer.price_display,
      price_value: offer.price_value,
      currency: offer.currency,
      billing_frequency: offer.billing_frequency,
      deliverables: Array.isArray(offer.deliverables) ? offer.deliverables as string[] : [],
      value_propositions: Array.isArray(offer.value_propositions) ? offer.value_propositions as string[] : [],
    };
    setPresentedOfferId(offerData.id);
    // Send targeted signals to each selected participant
    for (const targetId of targetParticipantIds) {
      signalingRef.current?.send('offer-presented', { offer: offerData }, targetId);
    }
  }, []);

  // Dismiss offer (host can dismiss, or guest can dismiss their overlay)
  const dismissOffer = useCallback(() => {
    if (isHost) {
      setPresentedOfferId(null);
      signalingRef.current?.send('offer-dismissed', {});
    } else {
      setPresentedOffer(null);
    }
  }, [isHost]);

  // Accept offer (guest side)
  const acceptOffer = useCallback(async () => {
    if (!presentedOffer) return;

    signalingRef.current?.send('offer-accepted', {
      offerId: presentedOffer.id,
      offerName: presentedOffer.name,
      guestName: guestName || 'Attendee',
      guestEmail: guestEmail || '',
    });

    try {
      await fetch(`/api/calls/${roomCode}/offer-accepted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: presentedOffer.id,
          guestName: guestName || undefined,
          guestEmail: guestEmail || undefined,
        }),
      });
    } catch {
      // Non-blocking
    }

    setPresentedOffer(null);
  }, [presentedOffer, guestName, guestEmail, roomCode]);

  // Decline offer (guest side — sends reason to host)
  const declineOffer = useCallback((reason: string) => {
    if (!presentedOffer) return;

    signalingRef.current?.send('offer-declined', {
      offerId: presentedOffer.id,
      offerName: presentedOffer.name,
      guestName: guestName || 'Attendee',
      reason,
    });

    setPresentedOffer(null);
  }, [presentedOffer, guestName]);

  // Minimize offer (guest side — notifies host)
  const minimizeOffer = useCallback(() => {
    if (!presentedOffer) return;

    signalingRef.current?.send('offer-minimized', {
      offerId: presentedOffer.id,
      guestName: guestName || 'Attendee',
    });
  }, [presentedOffer, guestName]);

  const endCall = useCallback(async () => {
    // Show saving modal immediately
    setIsSaving(true);
    const startTime = Date.now();

    // Stop transcription
    if (transcriptionRef.current) {
      transcriptionRef.current.stop();
      transcriptionRef.current = null;
    }

    // Stop recording if active — upload directly (don't rely on onStop callback)
    if (recorderRef.current) {
      const blob = await recorderRef.current.stop();
      recorderRef.current = null;
      setRecordingState('idle');

      // Upload recording and wait for it to finish before redirecting
      if (organizationId && callId && blob.size > 0) {
        try {
          await uploadRecording(organizationId, callId, blob);
        } catch {
          console.error('Failed to upload recording on end call');
        }
      }
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

    // Update call status + trigger post-call pipeline
    try {
      await fetch(`/api/calls/${roomCode}/end`, { method: 'POST' });
    } catch {
      // Ignore - we're leaving anyway
    }

    // Ensure at least 4 seconds of saving screen
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(4000 - elapsed, 0);
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
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
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
          {(isHost ? ['attendees', 'insights', 'offers'] : ['attendees']).map((panel) => (
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
        <div className="flex-1 min-w-0 relative">
          <VideoPanel
            localStream={localStreamRef.current}
            participants={participants}
            localUserId={userId || null}
            localParticipantId={participantIdRef.current}
            isCameraOff={isCameraOff}
            isScreenSharing={isScreenSharing}
            callActive={callActive}
            isWaiting={!isHost && localStatus === 'waiting'}
            displayName={displayName}
            onStartMedia={startMedia}
          />

          {/* Offer overlay moved to fixed position outside video panel */}

          {/* Floating live caption — visible when captions enabled */}
          {callActive && showCaptions && transcripts.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2.5 max-w-[80%] pointer-events-auto">
                <p className="text-white text-sm leading-relaxed text-center">
                  {transcripts[transcripts.length - 1].content}
                </p>
                <p className="text-white/40 text-[10px] text-center mt-0.5">
                  {transcripts[transcripts.length - 1].speakerLabel} &middot; Live Caption
                </p>
              </div>
            </div>
          )}
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
                transcriptCount={transcripts.length}
              />
            )}
            {activePanel === 'transcript' && (
              <TranscriptPanel
                transcripts={transcripts}
              />
            )}
            {activePanel === 'insights' && (
              <div className="flex flex-col h-full">
                {/* Transcript — top half */}
                <div className="flex-1 min-h-0 border-b border-white/10">
                  <TranscriptPanel transcripts={transcripts} />
                </div>
                {/* Copilot — bottom half */}
                <div className="flex-1 min-h-0">
                  <CopilotPanel
                    guidance={guidance}
                    callActive={callActive}
                    transcriptCount={transcripts.length}
                  />
                </div>
              </div>
            )}
            {activePanel === 'offers' && isHost && (
              <OffersPanel
                onPresentOffer={presentOffer}
                onDismissOffer={dismissOffer}
                presentedOfferId={presentedOfferId}
                offerResponses={offerResponses}
                participants={participants}
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
        onToggleOffers={() => setActivePanel(activePanel === 'offers' ? 'none' : 'offers')}
        isOffersOpen={activePanel === 'offers'}
        onOpenSettings={() => setShowDeviceSettings(true)}
        onToggleCaptions={() => setShowCaptions(prev => !prev)}
        isCaptionsOn={showCaptions}
      />

      {/* Device Settings Modal */}
      <DeviceSettings
        open={showDeviceSettings}
        onClose={() => setShowDeviceSettings(false)}
        onDeviceChange={handleDeviceChange}
        currentStream={localStreamRef.current}
      />

      {/* Offer overlay — shown to guests/team when host presents an offer */}
      {!isHost && presentedOffer && (
        <OfferOverlay
          offer={presentedOffer}
          onAccept={acceptOffer}
          onDismiss={dismissOffer}
          onDecline={declineOffer}
          onMinimize={minimizeOffer}
        />
      )}

      {/* Saving modal — shown when host ends call */}
      {isSaving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F1F1D]/95 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-white/10" />
              <div className="absolute inset-0 rounded-full border-4 border-t-teal border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Saving your meeting data...</h2>
            <p className="text-white/50 text-sm">Please wait while we process your call transcript, generate summaries, and save action items.</p>
            <div className="mt-6 flex justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
