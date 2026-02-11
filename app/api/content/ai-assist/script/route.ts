import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireCredits } from '@/lib/ai/server';
import { generateScriptFromPost } from '@/lib/content-engine/generate-script';

export async function POST(request: Request) {
  try {
    const {
      organizationId,
      caption,
      hashtags,
      format,
      funnelStage,
      storybrandStage,
      modelOverride,
      selectedBrandVariables,
    } = await request.json();

    if (!organizationId || !caption) {
      return NextResponse.json({ error: 'organizationId and caption are required' }, { status: 400 });
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

    // Pre-flight credit check (~2000 input + ~1000 output tokens)
    const creditBlock = await requireCredits(organizationId, modelOverride || 'gemini-2.0-flash', 2000, 1000, user.id);
    if (creditBlock) return creditBlock;

    const result = await generateScriptFromPost(supabase, organizationId, user.id, {
      caption,
      hashtags: hashtags || [],
      format: format || 'short_video_30_60',
      funnelStage: funnelStage || 'awareness',
      storybrandStage: storybrandStage || 'character',
      modelOverride,
      selectedBrandVariables,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[AI-ASSIST-SCRIPT]', error);
    const message = error instanceof Error ? error.message : 'Failed to generate script';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
