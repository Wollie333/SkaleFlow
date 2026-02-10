import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateSingleItem } from '@/lib/content-engine/generate-content';
import { buildFeedbackPromptSection } from '@/lib/content-engine/feedback-service';
import { isSuperAdmin } from '@/lib/ai/credits';

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { modelOverride, selectedBrandVariables } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load the content item
    const { data: item, error: itemError } = await supabase
      .from('content_items')
      .select('id, organization_id, format, funnel_stage, storybrand_stage')
      .eq('id', itemId)
      .single();

    if (!item || itemError) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', item.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Build rejection feedback for the prompt
    let rejectionFeedback = '';
    try {
      rejectionFeedback = await buildFeedbackPromptSection(serviceClient, item.organization_id);
    } catch {
      // Non-critical — continue without feedback
    }

    // Generate new content directly (no queue overhead)
    const result = await generateSingleItem(
      serviceClient,
      item.organization_id,
      user.id,
      itemId,
      modelOverride || null,
      [], // no previous context for single regen
      selectedBrandVariables || null,
      rejectionFeedback || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Generation failed' },
        { status: result.error === 'Insufficient credits' ? 402 : 500 }
      );
    }

    // Record regeneration feedback
    const isAdmin = await isSuperAdmin(user.id);
    await serviceClient
      .from('content_feedback')
      .insert({
        content_item_id: itemId,
        organization_id: item.organization_id,
        user_id: user.id,
        feedback_type: 'regenerated',
        generation_config: {
          format: item.format,
          funnel_stage: item.funnel_stage,
          storybrand_stage: item.storybrand_stage,
          model: modelOverride || null,
        },
      });

    // Fetch the updated content item
    const { data: updatedItem } = await serviceClient
      .from('content_items')
      .select('id, topic, caption, hashtags, funnel_stage, storybrand_stage, format, platforms, media_urls, scheduled_date')
      .eq('id', itemId)
      .single();

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Regenerate content error:', error);
    return NextResponse.json({ error: 'Failed to regenerate content' }, { status: 500 });
  }
}
