import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCredits } from '@/lib/ai/server';
import { generatePostContent } from '@/lib/content-engine/generate-post-content';

export async function POST(request: Request) {
  try {
    const {
      organizationId,
      funnelStage,
      storybrandStage,
      format,
      platforms,
      modelOverride,
      existingCaption,
      selectedBrandVariables,
    } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Pre-flight credit check (~1500 input + ~500 output tokens)
    const creditBlock = await requireCredits(organizationId, modelOverride || 'gemini-2.0-flash', 1500, 500, user.id);
    if (creditBlock) return creditBlock;

    const result = await generatePostContent(supabase, organizationId, user.id, {
      funnelStage: funnelStage || 'awareness',
      storybrandStage: storybrandStage || 'character',
      format: format || 'short_video_30_60',
      platforms: platforms || ['linkedin'],
      modelOverride,
      existingCaption,
      selectedBrandVariables,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[AI-ASSIST-POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to generate post content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
