'use client';

import { useState, useEffect, useRef } from 'react';

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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Enumerate devices
  useEffect(() => {
    if (!open) return;

    async function loadDevices() {
      try {
        // Need permission first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(s => {
          s.getTracks().forEach(t => t.stop());
        }).catch(() => {});

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audio = devices
          .filter(d => d.kind === 'audioinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
        const video = devices
          .filter(d => d.kind === 'videoinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));

        setAudioDevices(audio);
        setVideoDevices(video);

        // Set current selection from active stream
        if (currentStream) {
          const audioTrack = currentStream.getAudioTracks()[0];
          const videoTrack = currentStream.getVideoTracks()[0];
          if (audioTrack) {
            const settings = audioTrack.getSettings();
            setSelectedAudio(settings.deviceId || audio[0]?.deviceId || '');
          }
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            setSelectedVideo(settings.deviceId || video[0]?.deviceId || '');
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
  }, [open, currentStream]);

  // Audio level meter
  useEffect(() => {
    if (!open || !currentStream) return;

    try {
      const audioCtx = new AudioContext();
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

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioCtx.close();
      };
    } catch {
      // AudioContext not available
    }
  }, [open, currentStream]);

  // Camera preview
  useEffect(() => {
    if (!open || !previewRef.current || !currentStream) return;
    previewRef.current.srcObject = currentStream;
  }, [open, currentStream]);

  function handleApply() {
    onDeviceChange(
      selectedAudio || null,
      selectedVideo || null,
    );
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#1A2F2D] border border-white/10 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
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
          <div className="relative bg-black rounded-xl overflow-hidden mb-5 aspect-video">
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!currentStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/40 text-sm">No camera active</p>
              </div>
            )}
          </div>

          {/* Camera selector */}
          <div className="mb-4">
            <label className="block text-white/60 text-xs font-medium mb-1.5">Camera</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {videoDevices.length === 0 && <option value="">No cameras found</option>}
              {videoDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Microphone selector */}
          <div className="mb-4">
            <label className="block text-white/60 text-xs font-medium mb-1.5">Microphone</label>
            <select
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
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
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <p className="text-white/30 text-xs mt-1">Speak to test your microphone</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5"
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
