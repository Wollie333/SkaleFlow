import { CALL_CONFIG } from './config';

export interface RecordingOptions {
  onDataAvailable?: (blob: Blob) => void;
  onStop?: (blob: Blob) => void;
}

/**
 * Manages call recording via MediaRecorder API.
 */
export class CallRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private options: RecordingOptions;

  constructor(options: RecordingOptions = {}) {
    this.options = options;
  }

  /**
   * Start recording a combined stream.
   */
  start(stream: MediaStream): void {
    const mimeType = MediaRecorder.isTypeSupported(CALL_CONFIG.recording.mimeType)
      ? CALL_CONFIG.recording.mimeType
      : 'video/webm';

    this.recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: CALL_CONFIG.recording.videoBitsPerSecond,
    });

    this.chunks = [];

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        this.options.onDataAvailable?.(event.data);
      }
    };

    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: mimeType });
      this.options.onStop?.(blob);
    };

    // Collect data every 5 seconds
    this.recorder.start(5000);
  }

  /**
   * Stop recording and return the full blob.
   */
  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        resolve(new Blob(this.chunks));
        return;
      }

      this.recorder.onstop = () => {
        const mimeType = this.recorder?.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.options.onStop?.(blob);
        resolve(blob);
      };

      this.recorder.stop();
    });
  }

  /**
   * Check if currently recording.
   */
  get isRecording(): boolean {
    return this.recorder?.state === 'recording';
  }
}

/**
 * Upload a recording blob to Supabase Storage.
 */
export async function uploadRecording(
  orgId: string,
  callId: string,
  blob: Blob
): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', blob, `${callId}.webm`);
  formData.append('orgId', orgId);
  formData.append('callId', callId);

  try {
    const res = await fetch('/api/calls/recording', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  } catch {
    console.error('Failed to upload recording');
    return null;
  }
}
