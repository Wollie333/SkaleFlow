import { CALL_CONFIG } from './config';

export type QualityTier = 'high' | 'medium' | 'low';

/**
 * Monitor peer connection quality and recommend quality tier.
 */
export class QualityMonitor {
  private pc: RTCPeerConnection;
  private interval: NodeJS.Timeout | null = null;
  private onQualityChange: (tier: QualityTier) => void;
  private currentTier: QualityTier = 'high';

  constructor(pc: RTCPeerConnection, onQualityChange: (tier: QualityTier) => void) {
    this.pc = pc;
    this.onQualityChange = onQualityChange;
  }

  /**
   * Start monitoring quality every 5 seconds.
   */
  start(): void {
    this.interval = setInterval(async () => {
      try {
        const stats = await this.pc.getStats();
        let totalPacketsLost = 0;
        let totalPacketsSent = 0;
        let availableBitrate = 0;

        stats.forEach((report) => {
          if (report.type === 'outbound-rtp' && report.kind === 'video') {
            totalPacketsSent += report.packetsSent || 0;
            totalPacketsLost += report.packetsLost || 0;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            availableBitrate = report.availableOutgoingBitrate || 0;
          }
        });

        const lossRate = totalPacketsSent > 0 ? totalPacketsLost / totalPacketsSent : 0;

        let newTier: QualityTier = 'high';
        if (lossRate > 0.1 || availableBitrate < 300_000) {
          newTier = 'low';
        } else if (lossRate > 0.03 || availableBitrate < 800_000) {
          newTier = 'medium';
        }

        if (newTier !== this.currentTier) {
          this.currentTier = newTier;
          this.onQualityChange(newTier);
        }
      } catch {
        // Stats not available yet
      }
    }, 5000);
  }

  /**
   * Stop monitoring.
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Get recommended video constraints for the current tier.
   */
  getConstraints(): MediaTrackConstraints {
    return CALL_CONFIG.videoConstraints[this.currentTier];
  }
}
