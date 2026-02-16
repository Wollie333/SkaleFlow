import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SignalType =
  | 'sdp-offer'
  | 'sdp-answer'
  | 'ice-candidate'
  | 'participant-joined'
  | 'participant-left'
  | 'recording-started'
  | 'recording-stopped'
  | 'mute-changed'
  | 'camera-changed';

export interface SignalMessage {
  type: SignalType;
  senderId: string;
  targetId?: string; // null = broadcast
  payload: Record<string, unknown>;
}

export type SignalHandler = (message: SignalMessage) => void;

/**
 * Creates and manages a Supabase Realtime channel for call signaling.
 */
export class CallSignaling {
  private channel: RealtimeChannel | null = null;
  private handlers: Map<SignalType, SignalHandler[]> = new Map();
  private roomCode: string;
  private participantId: string;

  constructor(roomCode: string, participantId: string) {
    this.roomCode = roomCode;
    this.participantId = participantId;
  }

  /**
   * Connect to the signaling channel.
   */
  async connect(): Promise<void> {
    const supabase = createClient();

    this.channel = supabase.channel(`call:${this.roomCode}`, {
      config: { broadcast: { self: false } },
    });

    this.channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      const message = payload as SignalMessage;
      // Skip messages not intended for us (if targeted)
      if (message.targetId && message.targetId !== this.participantId) return;

      const typeHandlers = this.handlers.get(message.type);
      if (typeHandlers) {
        typeHandlers.forEach((handler) => handler(message));
      }
    });

    await this.channel.subscribe();
  }

  /**
   * Send a signal message.
   */
  async send(type: SignalType, payload: Record<string, unknown>, targetId?: string): Promise<void> {
    if (!this.channel) {
      console.warn('[Signaling] Not connected, cannot send');
      return;
    }

    const message: SignalMessage = {
      type,
      senderId: this.participantId,
      targetId,
      payload,
    };

    await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: message,
    });
  }

  /**
   * Register a handler for a specific signal type.
   */
  on(type: SignalType, handler: SignalHandler): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  /**
   * Remove a handler.
   */
  off(type: SignalType, handler: SignalHandler): void {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(
      type,
      existing.filter((h) => h !== handler)
    );
  }

  /**
   * Disconnect from the channel.
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.handlers.clear();
  }

  get isConnected(): boolean {
    return this.channel !== null;
  }
}
