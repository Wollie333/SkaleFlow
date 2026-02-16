/**
 * Start screen sharing via getDisplayMedia.
 */
export async function startScreenShare(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  return stream;
}

/**
 * Stop screen sharing — stops all tracks.
 */
export function stopScreenShare(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
