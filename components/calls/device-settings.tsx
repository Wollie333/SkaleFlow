'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface DeviceSettingsProps {
  open: boolean;
  onClose: () => void;
  onDeviceChange: (audioDeviceId: string | null, videoDeviceId: string | null) => void;
  currentStream: MediaStream | null;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
}

export function DeviceSettings({ open, onClose, onDeviceChange, currentStream }: DeviceSettingsProps) {
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const previewRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Cleanup preview stream
  const stopPreview = useCallback(() => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach(t => t.stop());
      previewStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Enumerate devices on open
  useEffect(() => {
    if (!open) {
      stopPreview();
      return;
    }

    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audio = devices
          .filter(d => d.kind === 'audioinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
        const video = devices
          .filter(d => d.kind === 'videoinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));

        setAudioDevices(audio);
        setVideoDevices(video);

        // Set current selection from active stream tracks
        if (currentStream) {
          const audioTrack = currentStream.getAudioTracks()[0];
          const videoTrack = currentStream.getVideoTracks()[0];
          if (audioTrack) {
            const settings = audioTrack.getSettings();
            setSelectedAudio(settings.deviceId || audio[0]?.deviceId || '');
          } else if (audio.length > 0) {
            setSelectedAudio(audio[0].deviceId);
          }
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            setSelectedVideo(settings.deviceId || video[0]?.deviceId || '');
          } else if (video.length > 0) {
            setSelectedVideo(video[0].deviceId);
          }
        } else {
          if (audio.length > 0) setSelectedAudio(audio[0].deviceId);
          if (video.length > 0) setSelectedVideo(video[0].deviceId);
        }
      } catch {
        // Permission denied or not available
      }
    }

    loadDevices();
  }, [open, currentStream, stopPreview]);

  // Show preview from the CURRENT stream (don't acquire a new one)
  useEffect(() => {
    if (!open) return;

    // Use the existing current stream for preview — no new getUserMedia call
    if (currentStream && previewRef.current) {
      previewRef.current.srcObject = currentStream;
      previewRef.current.play().catch(() => {});
    }

    // Audio level meter from current stream
    if (currentStream && currentStream.getAudioTracks().length > 0) {
      try {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(currentStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          setAudioLevel(Math.min(avg / 128, 1));
          animFrameRef.current = requestAnimationFrame(tick);
        }
        tick();
      } catch {
        // AudioContext not available
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [open, currentStream]);

  function handleApply() {
    onDeviceChange(selectedAudio || null, selectedVideo || null);
    onClose();
  }

  if (!open) return null;

  const hasVideo = currentStream ? currentStream.getVideoTracks().length > 0 : false;
  const hasAudio = currentStream ? currentStream.getAudioTracks().length > 0 : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#1A2F2D] border border-white/10 rounded-2xl shadow-xl max-w-sm md:max-w-md w-full mx-2 md:mx-4">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg">Device Settings</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white/70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Camera preview */}
          <div className="relative bg-black rounded-xl overflow-hidden mb-3 md:mb-5 aspect-video">
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-8 h-8 text-white/20 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <p className="text-white/40 text-xs">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-white/60 text-xs font-medium">Camera</label>
              {hasVideo && <span className="text-emerald-400 text-[10px]">Active</span>}
              {!hasVideo && videoDevices.length > 0 && <span className="text-amber-400 text-[10px]">Not started</span>}
            </div>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full px-3 py-2 bg-cream-warm/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {videoDevices.length === 0 && <option value="">No cameras found</option>}
              {videoDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Microphone selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-white/60 text-xs font-medium">Microphone</label>
              {hasAudio && <span className="text-emerald-400 text-[10px]">Active</span>}
              {!hasAudio && audioDevices.length > 0 && <span className="text-amber-400 text-[10px]">Not started</span>}
            </div>
            <select
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
              className="w-full px-3 py-2 bg-cream-warm/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {audioDevices.length === 0 && <option value="">No microphones found</option>}
              {audioDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Audio level indicator */}
          <div className="mb-6">
            <label className="block text-white/60 text-xs font-medium mb-1.5">Mic Level</label>
            <div className="w-full h-2 bg-cream-warm/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            {hasAudio ? (
              <p className="text-white/30 text-xs mt-1">Speak to test your microphone</p>
            ) : (
              <p className="text-amber-400/60 text-xs mt-1">Microphone not active — click Apply to start</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:bg-cream/5"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 rounded-lg bg-teal text-white text-sm font-semibold hover:bg-teal/80"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
