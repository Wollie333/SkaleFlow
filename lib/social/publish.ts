import { getAdapter } from './auth';
import { formatForPlatform, canPublishToPlatform } from './formatters';
import { ensureValidToken, type ConnectionWithTokens } from './token-manager';
import type { SocialPlatform, PublishResult } from './types';

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 3,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.allSettled(batch.map(t => t()));
    results.push(...batchResults);
  }
  return results;
}

interface ContentItem {
  id: string;
  topic: string | null;
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[] | null;
  media_urls: string[] | null;
  target_url?: string | null;
  utm_parameters?: Record<string, string> | null;
  placement_type?: string | null;
}

export interface PublishToConnectionResult {
  platform: SocialPlatform;
  connectionId: string;
  result: PublishResult;
}

export async function publishToConnection(
  connection: ConnectionWithTokens,
  contentItem: ContentItem,
): Promise<PublishToConnectionResult> {
  const platform = connection.platform;

  // Check if content meets platform requirements
  const check = canPublishToPlatform(platform, contentItem);
  if (!check.canPublish) {
    return {
      platform,
      connectionId: connection.id,
      result: { success: false, error: check.reason },
    };
  }

  try {
    let tokens = await ensureValidToken(connection);
    const postPayload = formatForPlatform(platform, contentItem, contentItem.placement_type as import('@/types/database').PlacementType | null);
    const adapter = getAdapter(platform);

    const result = await withRetry(async () => {
      try {
        return await adapter.publishPost(tokens, postPayload);
      } catch (err: unknown) {
        // Auto-refresh token on 401
        if (err instanceof Error && err.message.includes('401')) {
          tokens = await ensureValidToken({ ...connection, token_expires_at: null } as ConnectionWithTokens);
        }
        throw err;
      }
    });

    return { platform, connectionId: connection.id, result };
  } catch (error) {
    return {
      platform,
      connectionId: connection.id,
      result: {
        success: false,
        error: error instanceof Error ? error.message : 'Publishing failed',
      },
    };
  }
}

export async function publishToMultipleConnections(
  connections: ConnectionWithTokens[],
  contentItem: ContentItem,
): Promise<PublishToConnectionResult[]> {
  const tasks = connections.map(conn => () => publishToConnection(conn, contentItem));
  const results = await withConcurrencyLimit(tasks, 3);

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      platform: connections[i].platform,
      connectionId: connections[i].id,
      result: {
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      },
    };
  });
}
