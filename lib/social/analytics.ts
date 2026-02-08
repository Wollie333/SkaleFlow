import { getAdapter } from './auth';
import { ensureValidToken, type ConnectionWithTokens } from './token-manager';
import type { SocialPlatform, AnalyticsData } from './types';

export interface FetchAnalyticsResult {
  platform: SocialPlatform;
  postId: string;
  data: AnalyticsData | null;
  error?: string;
}

export async function fetchPostAnalytics(
  connection: ConnectionWithTokens,
  platformPostId: string,
): Promise<FetchAnalyticsResult> {
  try {
    const tokens = await ensureValidToken(connection);
    const adapter = getAdapter(connection.platform);
    const data = await adapter.getPostAnalytics(tokens, platformPostId);

    return {
      platform: connection.platform,
      postId: platformPostId,
      data,
    };
  } catch (error) {
    return {
      platform: connection.platform,
      postId: platformPostId,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    };
  }
}
