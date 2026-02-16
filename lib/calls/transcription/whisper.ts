/**
 * Faster-Whisper transcription provider (production).
 * Sends audio chunks to self-hosted Whisper endpoint.
 */

import { CALL_CONFIG } from '../config';

export interface WhisperResult {
  text: string;
  confidence: number;
  language?: string;
}

/**
 * Send an audio chunk to the Whisper endpoint for transcription.
 */
export async function transcribeChunk(audioBlob: Blob): Promise<WhisperResult | null> {
  const endpoint = CALL_CONFIG.whisperEndpoint;
  if (!endpoint) {
    console.warn('[Whisper] No endpoint configured');
    return null;
  }

  const formData = new FormData();
  formData.append('audio', audioBlob, 'chunk.webm');
  formData.append('language', 'en');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.error('[Whisper] Transcription failed:', res.status);
      return null;
    }

    const data = await res.json();
    return {
      text: data.text || '',
      confidence: data.confidence || 0.9,
      language: data.language,
    };
  } catch (err) {
    console.error('[Whisper] Request failed:', err);
    return null;
  }
}

/**
 * Audio chunker — captures audio from a stream in segments.
 */
export class AudioChunker {
  private recorder: MediaRecorder | null = null;
  private onChunk: (blob: Blob) => void;
  private intervalMs: number;

  constructor(onChunk: (blob: Blob) => void, intervalMs = 3000) {
    this.onChunk = onChunk;
    this.intervalMs = intervalMs;
  }

  start(stream: MediaStream): void {
    this.recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.onChunk(event.data);
      }
    };

    this.recorder.start(this.intervalMs);
  }

  stop(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    this.recorder = null;
  }
}
