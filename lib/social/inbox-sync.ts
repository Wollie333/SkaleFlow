import { createServiceClient } from '@/lib/supabase/server';
import { getAdapter } from './auth';
import { ensureValidToken, type ConnectionWithTokens } from './token-manager';
import type { InboxItem, SocialPlatform } from './types';
import type { Json } from '@/types/database';

// Simple keyword-based sentiment detection
function detectSentiment(text: string): 'positive' | 'negative' | 'question' | 'neutral' {
  const lower = text.toLowerCase();
  const positiveWords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'perfect', 'beautiful', 'thank', 'thanks', 'wonderful', 'best', 'good', 'nice', 'helpful', '❤️', '🔥', '👏', '💯', '🙌'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'horrible', 'bad', 'ugly', 'disappointing', 'poor', 'waste', 'scam', 'fake', 'spam', 'sucks', 'useless'];
  const questionIndicators = ['?', 'how', 'what', 'when', 'where', 'why', 'who', 'can you', 'could you', 'is there', 'do you', 'does'];

  if (questionIndicators.some(q => lower.includes(q))) return 'question';
  if (positiveWords.some(w => lower.includes(w))) return 'positive';
  if (negativeWords.some(w => lower.includes(w))) return 'negative';
  return 'neutral';
}

// Delay helper for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface SyncResult {
  connectionId: string;
  platform: SocialPlatform;
  commentsAdded: number;
  mentionsAdded: number;
  errors: string[];
}

export async function syncConnectionInbox(
  connection: ConnectionWithTokens,
  orgId: string,
): Promise<SyncResult> {
  const result: SyncResult = {
    connectionId: connection.id,
    platform: connection.platform,
    commentsAdded: 0,
    mentionsAdded: 0,
    errors: [],
  };

  const supabase = createServiceClient();
  const adapter = getAdapter(connection.platform);

  let tokens;
  try {
    tokens = await ensureValidToken(connection);
  } catch (err) {
    result.errors.push(`Token refresh failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    return result;
  }

  // Fetch comments on published posts
  if (adapter.fetchComments) {
    const { data: posts } = await supabase
      .from('published_posts')
      .select('id, platform_post_id')
      .eq('connection_id', connection.id)
      .eq('publish_status', 'published')
      .not('platform_post_id', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20); // Last 20 posts

    for (const post of posts || []) {
      try {
        const comments = await adapter.fetchComments(tokens, post.platform_post_id!);
        for (const item of comments) {
          const sentiment = item.sentiment || detectSentiment(item.message || '');
          await supabase
            .from('social_interactions')
            .upsert({
              organization_id: orgId,
              connection_id: connection.id,
              platform: connection.platform,
              interaction_type: item.type,
              platform_interaction_id: item.platformInteractionId,
              parent_interaction_id: item.parentId || null,
              published_post_id: post.id,
              message: item.message,
              author_platform_id: item.authorId,
              author_name: item.authorName,
              author_username: item.authorUsername || null,
              author_avatar_url: item.authorAvatarUrl || null,
              sentiment,
              interaction_timestamp: item.timestamp,
            }, {
              onConflict: 'connection_id,platform_interaction_id',
              ignoreDuplicates: true,
            });
          result.commentsAdded++;
        }
        await delay(2000); // Rate limit: 2s between API calls
      } catch (err) {
        result.errors.push(`Comments for post ${post.platform_post_id}: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
  }

  // Fetch mentions
  if (adapter.fetchMentions) {
    try {
      const mentions = await adapter.fetchMentions(tokens);
      for (const item of mentions) {
        const sentiment = item.sentiment || detectSentiment(item.message || '');
        await supabase
          .from('social_interactions')
          .upsert({
            organization_id: orgId,
            connection_id: connection.id,
            platform: connection.platform,
            interaction_type: 'mention',
            platform_interaction_id: item.platformInteractionId,
            message: item.message,
            author_platform_id: item.authorId,
            author_name: item.authorName,
            author_username: item.authorUsername || null,
            author_avatar_url: item.authorAvatarUrl || null,
            sentiment,
            interaction_timestamp: item.timestamp,
          }, {
            onConflict: 'connection_id,platform_interaction_id',
            ignoreDuplicates: true,
          });
        result.mentionsAdded++;
      }
    } catch (err) {
      result.errors.push(`Mentions: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  // Update sync timestamp
  await supabase
    .from('social_media_connections')
    .update({
      inbox_last_synced_at: new Date().toISOString(),
    })
    .eq('id', connection.id);

  return result;
}

export async function syncOrgInbox(orgId: string): Promise<SyncResult[]> {
  const supabase = createServiceClient();

  const { data: connections } = await supabase
    .from('social_media_connections')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (!connections || connections.length === 0) return [];

  const results: SyncResult[] = [];
  for (const connection of connections) {
    const result = await syncConnectionInbox(
      connection as unknown as ConnectionWithTokens,
      orgId
    );
    results.push(result);
  }

  return results;
}
