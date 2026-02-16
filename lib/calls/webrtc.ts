import { CALL_CONFIG } from './config';

export interface PeerConnectionOptions {
  onTrack: (event: RTCTrackEvent, peerId: string) => void;
  onIceCandidate: (candidate: RTCIceCandidate, peerId: string) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState, peerId: string) => void;
}

/**
 * Manages WebRTC peer connections in a mesh topology.
 */
export class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private options: PeerConnectionOptions;

  constructor(options: PeerConnectionOptions) {
    this.options = options;
  }

  /**
   * Set the local media stream.
   */
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    // Add tracks to all existing peers
    this.peers.forEach((pc) => {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    });
  }

  /**
   * Create a new peer connection.
   */
  createPeer(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: CALL_CONFIG.iceServers,
    });

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      this.options.onTrack(event, peerId);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.options.onIceCandidate(event.candidate, peerId);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      this.options.onConnectionStateChange(pc.connectionState, peerId);

      // Auto-cleanup failed connections
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(peerId);
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  /**
   * Create and send an offer to a peer.
   */
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    let pc = this.peers.get(peerId);
    if (!pc) pc = this.createPeer(peerId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handle an incoming offer and create an answer.
   */
  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    let pc = this.peers.get(peerId);
    if (!pc) pc = this.createPeer(peerId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Handle an incoming answer.
   */
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) {
      console.warn(`[WebRTC] No peer connection for ${peerId}`);
      return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle an incoming ICE candidate.
   */
  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) {
      console.warn(`[WebRTC] No peer connection for ${peerId}`);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Remove a peer connection.
   */
  removePeer(peerId: string): void {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
  }

  /**
   * Replace a track (e.g., when switching from camera to screen share).
   */
  async replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack): Promise<void> {
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find((s) => s.track === oldTrack);
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    }
  }

  /**
   * Get all peer IDs.
   */
  getPeerIds(): string[] {
    return Array.from(this.peers.keys());
  }

  /**
   * Cleanup all connections.
   */
  destroy(): void {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.localStream = null;
  }
}
