/**
 * Transcription manager — abstracts browser vs whisper providers.
 */

import { CALL_CONFIG } from '../config';
import { BrowserTranscription, type TranscriptResult } from './browser';
import { AudioChunker, transcribeChunk } from './whisper';

export type TranscriptHandler = (result: {
  text: string;
  confidence: number;
  isFinal: boolean;
  speakerLabel: string;
}) => void;

export class TranscriptionManager {
  private browserTranscription: BrowserTranscription | null = null;
  private audioChunker: AudioChunker | null = null;
  private handler: TranscriptHandler | null = null;
  private speakerLabel: string;
  private provider: 'browser' | 'whisper';

  constructor(speakerLabel: string) {
    this.speakerLabel = speakerLabel;
    this.provider = CALL_CONFIG.transcriptionProvider;
  }

  /**
   * Start transcription.
   * @param stream - Audio stream (used for whisper provider)
   */
  start(handler: TranscriptHandler, stream?: MediaStream): void {
    this.handler = handler;

    if (this.provider === 'browser') {
      this.browserTranscription = new BrowserTranscription();
      this.browserTranscription.start((result: TranscriptResult) => {
        this.handler?.({
          text: result.text,
          confidence: result.confidence,
          isFinal: result.isFinal,
          speakerLabel: this.speakerLabel,
        });
      });
    } else if (this.provider === 'whisper' && stream) {
      this.audioChunker = new AudioChunker(async (blob) => {
        const result = await transcribeChunk(blob);
        if (result && result.text.trim()) {
          this.handler?.({
            text: result.text,
            confidence: result.confidence,
            isFinal: true,
            speakerLabel: this.speakerLabel,
          });
        }
      });
      this.audioChunker.start(stream);
    }
  }

  stop(): void {
    this.browserTranscription?.stop();
    this.audioChunker?.stop();
    this.handler = null;
  }

  get isSupported(): boolean {
    if (this.provider === 'browser') {
      return new BrowserTranscription().isSupported;
    }
    return !!CALL_CONFIG.whisperEndpoint;
  }
}
