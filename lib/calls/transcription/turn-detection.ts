/**
 * Detects speaker turns and silence gaps.
 * Triggers AI processing when a speaker finishes talking.
 */

export interface TurnEvent {
  type: 'speaker_change' | 'silence' | 'long_utterance';
  speakerLabel: string;
  accumulatedText: string;
  durationMs: number;
}

export type TurnHandler = (event: TurnEvent) => void;

export class TurnDetector {
  private lastSpeaker: string | null = null;
  private lastSpeechTime: number = 0;
  private accumulatedText: string = '';
  private utteranceStartTime: number = 0;
  private silenceTimer: NodeJS.Timeout | null = null;
  private handler: TurnHandler | null = null;

  // Config
  private silenceThresholdMs: number;
  private longUtteranceMs: number;

  constructor(silenceThresholdMs = 2000, longUtteranceMs = 30000) {
    this.silenceThresholdMs = silenceThresholdMs;
    this.longUtteranceMs = longUtteranceMs;
  }

  start(handler: TurnHandler): void {
    this.handler = handler;
  }

  /**
   * Feed a transcript chunk to the detector.
   */
  onTranscript(speakerLabel: string, text: string, isFinal: boolean): void {
    const now = Date.now();

    // Speaker changed
    if (this.lastSpeaker && this.lastSpeaker !== speakerLabel && this.accumulatedText.trim()) {
      this.handler?.({
        type: 'speaker_change',
        speakerLabel: this.lastSpeaker,
        accumulatedText: this.accumulatedText.trim(),
        durationMs: now - this.utteranceStartTime,
      });
      this.accumulatedText = '';
      this.utteranceStartTime = now;
    }

    // First speech or new speaker
    if (!this.lastSpeaker || this.lastSpeaker !== speakerLabel) {
      this.utteranceStartTime = now;
    }

    this.lastSpeaker = speakerLabel;
    this.lastSpeechTime = now;

    if (isFinal) {
      this.accumulatedText += ' ' + text;
    }

    // Reset silence timer
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      if (this.accumulatedText.trim() && this.lastSpeaker) {
        this.handler?.({
          type: 'silence',
          speakerLabel: this.lastSpeaker,
          accumulatedText: this.accumulatedText.trim(),
          durationMs: Date.now() - this.utteranceStartTime,
        });
        this.accumulatedText = '';
      }
    }, this.silenceThresholdMs);

    // Long utterance check
    if (isFinal && now - this.utteranceStartTime > this.longUtteranceMs && this.accumulatedText.trim()) {
      this.handler?.({
        type: 'long_utterance',
        speakerLabel: speakerLabel,
        accumulatedText: this.accumulatedText.trim(),
        durationMs: now - this.utteranceStartTime,
      });
      // Don't reset — let silence timer handle final flush
    }
  }

  stop(): void {
    // Flush remaining text
    if (this.accumulatedText.trim() && this.lastSpeaker) {
      this.handler?.({
        type: 'silence',
        speakerLabel: this.lastSpeaker,
        accumulatedText: this.accumulatedText.trim(),
        durationMs: Date.now() - this.utteranceStartTime,
      });
    }
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.handler = null;
    this.accumulatedText = '';
    this.lastSpeaker = null;
  }
}
