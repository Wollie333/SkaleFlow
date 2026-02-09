import { getAdapter } from './auth';
import { formatForPlatform, canPublishToPlatform } from './formatters';
import { ensureValidToken, type ConnectionWithTokens } from './token-manager';
import type { SocialPlatform, PublishResult } from './types';

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
    // Ensure token is valid (refresh if needed)
    const tokens = await ensureValidToken(connection);

    // Format content for the platform (with placement-specific formatting)
    const postPayload = formatForPlatform(platform, contentItem, contentItem.placement_type as import('@/types/database').PlacementType | null);

    // Publish via platform adapter
    const adapter = getAdapter(platform);
    const result = await adapter.publishPost(tokens, postPayload);

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
  const results = await Promise.allSettled(
    connections.map(conn => publishToConnection(conn, contentItem))
  );

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
