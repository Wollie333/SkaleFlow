import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get content item
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select('id, status, created_at, updated_at, published_at, scheduled_date, scheduled_time, organization_id')
    .eq('id', itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
  }

  // Get published posts (publish attempts)
  const { data: publishedPosts } = await supabase
    .from('published_posts')
    .select('id, platform, publish_status, published_at, error_message, retry_count, post_url, created_at')
    .eq('content_item_id', itemId)
    .order('created_at', { ascending: true });

  // Get related notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, created_at, user_id')
    .eq('link', `/content?item=${itemId}`)
    .order('created_at', { ascending: true });

  // Build timeline
  const timeline: Array<{
    type: string;
    timestamp: string;
    description: string;
    details?: Record<string, unknown>;
  }> = [];

  // Created
  timeline.push({
    type: 'created',
    timestamp: item.created_at,
    description: 'Content item created',
  });

  // Scheduled
  if (item.scheduled_date) {
    timeline.push({
      type: 'scheduled',
      timestamp: item.scheduled_date,
      description: `Scheduled for ${item.scheduled_date}${item.scheduled_time ? ` at ${item.scheduled_time}` : ''}`,
    });
  }

  // Notifications (approvals, rejections, etc.)
  for (const notif of notifications || []) {
    timeline.push({
      type: notif.type,
      timestamp: notif.created_at,
      description: notif.title || notif.type,
      details: { body: notif.body },
    });
  }

  // Publish attempts
  for (const post of publishedPosts || []) {
    if (post.publish_status === 'published') {
      timeline.push({
        type: 'published',
        timestamp: post.published_at || post.created_at,
        description: `Published to ${post.platform}`,
        details: { postUrl: post.post_url, platform: post.platform },
      });
    } else if (post.publish_status === 'failed') {
      timeline.push({
        type: 'failed',
        timestamp: post.created_at,
        description: `Publish to ${post.platform} failed`,
        details: { error: post.error_message, retryCount: post.retry_count, platform: post.platform },
      });
    }
  }

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return NextResponse.json({
    contentItemId: itemId,
    currentStatus: item.status,
    timeline,
    publishedPosts: publishedPosts || [],
  });
}
