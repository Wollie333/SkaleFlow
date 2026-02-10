/**
 * Timeout wrapper for AI API calls.
 * Prevents calls from hanging forever when an AI provider is slow or unresponsive.
 */

/** Max time to wait for a single AI API call (30 seconds) */
export const AI_TIMEOUT_MS = 30_000;

/**
 * Race a promise against a timeout. If the promise doesn't resolve in time,
 * reject with a clear error message.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  providerName: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${providerName} API call timed out after ${ms / 1000}s`));
    }, ms);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
