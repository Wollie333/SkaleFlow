/**
 * Web Speech API transcription provider (dev/testing).
 * Uses browser's built-in speech recognition.
 */

export interface TranscriptResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export type TranscriptCallback = (result: TranscriptResult) => void;

export class BrowserTranscription {
  private recognition: SpeechRecognition | null = null;
  private isRunning = false;
  private callback: TranscriptCallback | null = null;

  constructor() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[Transcription] Web Speech API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    (this.recognition as unknown as { maxAlternatives: number }).maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0];
        this.callback?.({
          text: transcript.transcript.trim(),
          confidence: transcript.confidence,
          isFinal: result.isFinal,
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[Transcription] Speech recognition error:', event.error);
      // Auto-restart on non-fatal errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (this.isRunning) {
          setTimeout(() => this.restart(), 500);
        }
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be running
      if (this.isRunning) {
        setTimeout(() => this.restart(), 200);
      }
    };
  }

  start(callback: TranscriptCallback): void {
    if (!this.recognition) {
      console.warn('[Transcription] Speech recognition not available');
      return;
    }
    this.callback = callback;
    this.isRunning = true;
    try {
      this.recognition.start();
    } catch {
      // Already started
    }
  }

  stop(): void {
    this.isRunning = false;
    this.callback = null;
    try {
      this.recognition?.stop();
    } catch {
      // Already stopped
    }
  }

  private restart(): void {
    if (!this.isRunning || !this.recognition) return;
    try {
      this.recognition.start();
    } catch {
      // Already running
    }
  }

  get isSupported(): boolean {
    return this.recognition !== null;
  }
}
