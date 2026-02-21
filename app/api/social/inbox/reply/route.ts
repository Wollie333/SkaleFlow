import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdapter } from '@/lib/social/auth';
import { ensureValidToken, type ConnectionWithTokens } from '@/lib/social/token-manager';

// POST /api/social/inbox/reply - Reply to an interaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interactionId, message } = body;

    if (!interactionId || !message) {
      return NextResponse.json(
        { error: 'Interaction ID and message are required' },
        { status: 400 }
      );
    }

    // Get the interaction with its social connection
    const { data: interactionRaw, error: interactionError } = await supabase
      .from('social_interactions')
      .select('*')
      .eq('id', interactionId)
      .single();

    if (interactionError || !interactionRaw) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
    }

    // Fetch associated connection
    const { data: connectionData } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('id', interactionRaw.connection_id)
      .single();

    const interaction = { ...interactionRaw, connection: connectionData };

    // Send reply to the actual platform
    let platformReplyId: string | undefined;
    if (connectionData) {
      const adapter = getAdapter(connectionData.platform as import('@/types/database').SocialPlatform);
      if (adapter.replyToComment) {
        try {
          const tokens = await ensureValidToken(connectionData as unknown as ConnectionWithTokens);
          const replyResult = await adapter.replyToComment(tokens, interactionRaw.platform_interaction_id, message);
          if (replyResult.success) {
            platformReplyId = replyResult.platformReplyId;
          } else {
            console.warn('Platform reply failed:', replyResult.error);
          }
        } catch (err) {
          console.warn('Platform reply error:', err);
        }
      }
    }

    // Create a reply interaction record (for our own tracking)
    const { data: reply, error: replyError } = await supabase
      .from('social_interactions')
      .insert({
        organization_id: interaction.organization_id,
        connection_id: interaction.connection_id,
        platform: interaction.platform,
        interaction_type: 'reply',
        platform_interaction_id: platformReplyId || `reply_${Date.now()}`,
        parent_interaction_id: interaction.id,
        message,
        author_platform_id: interaction.connection?.platform_user_id ?? 'unknown',
        author_name: 'You',
        is_read: true,
        is_replied: true,
        interaction_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (replyError) {
      console.error('Error creating reply:', replyError);
      return NextResponse.json({ error: replyError.message }, { status: 500 });
    }

    // Update original interaction as replied
    await supabase
      .from('social_interactions')
      .update({
        is_replied: true,
        replied_at: new Date().toISOString(),
        replied_by: user.id,
      })
      .eq('id', interactionId);

    return NextResponse.json({ data: reply });
  } catch (error: any) {
    console.error('Error in POST /api/social/inbox/reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
