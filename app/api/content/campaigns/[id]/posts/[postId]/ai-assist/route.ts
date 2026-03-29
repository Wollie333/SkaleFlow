import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProviderAdapterForUser, resolveModel } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai';

export const maxDuration = 60;

interface AssistContext {
  topic?: string | null;
  platform?: string;
  format?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { field, currentContent, context } = body as {
      field: 'body' | 'visual_brief' | 'video_script' | 'caption';
      currentContent?: string | null;
      context: AssistContext;
    };

    // Get post to verify access and get organization_id
    const { data: post } = await supabase
      .from('content_posts')
      .select('organization_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Resolve AI model
    const resolvedModel = await resolveModel(post.organization_id, 'content_generation' as AIFeature, null);
    const { adapter } = await getProviderAdapterForUser(resolvedModel.provider, user.id);

    // Build prompt based on field
    const systemPrompt = buildSystemPrompt(field, context);
    const userPrompt = buildUserPrompt(field, currentContent, context);

    // Call AI
    const response = await adapter.complete({
      modelId: resolvedModel.modelId,
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
      maxTokens: 1024,
    });

    if (!response.text) {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 });
    }

    return NextResponse.json({ suggestion: response.text });
  } catch (error) {
    console.error('[AI-ASSIST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI assist failed' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(field: string, context: AssistContext): string {
  const basePrompt = 'You are a professional social media content writer.';

  switch (field) {
    case 'body':
      return `${basePrompt} Help improve post body content to be engaging, clear, and aligned with the platform's best practices.`;
    case 'visual_brief':
      return `${basePrompt} Help create detailed visual briefs for content creators, including mood, style, colors, composition, and text overlay suggestions.`;
    case 'video_script':
      return `${basePrompt} Help write compelling video scripts with dialogue, timing cues, scene descriptions, and direction notes.`;
    case 'caption':
      return `${basePrompt} Help write engaging ${context.platform || 'social media'} captions that complement the post content.`;
    default:
      return basePrompt;
  }
}

function buildUserPrompt(field: string, currentContent: string | null | undefined, context: AssistContext): string {
  const topic = context.topic || 'this post';
  const platform = context.platform || 'social media';
  const format = context.format || 'post';

  if (currentContent && currentContent.trim().length > 0) {
    // Improve existing content
    switch (field) {
      case 'body':
        return `Improve this ${platform} ${format} body content about "${topic}". Make it more engaging and impactful. Keep the same general message but enhance the writing:\n\n${currentContent}`;
      case 'visual_brief':
        return `Enhance this visual brief for a ${platform} ${format} about "${topic}". Add more specific details about mood, composition, and visual elements:\n\n${currentContent}`;
      case 'video_script':
        return `Improve this video script for a ${platform} ${format} about "${topic}". Enhance dialogue, add timing cues if missing, and make it more engaging:\n\n${currentContent}`;
      case 'caption':
        return `Improve this ${platform} caption about "${topic}". Make it more engaging and platform-appropriate:\n\n${currentContent}`;
      default:
        return `Improve this content:\n\n${currentContent}`;
    }
  } else {
    // Generate new content
    switch (field) {
      case 'body':
        return `Write engaging ${platform} ${format} body content about "${topic}". Make it compelling and appropriate for the platform.`;
      case 'visual_brief':
        return `Write a detailed visual brief for a ${platform} ${format} about "${topic}". Include mood, style, colors, composition, and any text overlay suggestions.`;
      case 'video_script':
        return `Write a compelling video script for a ${platform} ${format} about "${topic}". Include dialogue, timing cues (e.g., "0:00-0:03"), scene descriptions, and direction notes.`;
      case 'caption':
        return `Write an engaging ${platform} caption about "${topic}".`;
      default:
        return `Write content about "${topic}".`;
    }
  }
}
