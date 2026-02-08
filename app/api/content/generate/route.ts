import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContentForItems } from '@/lib/content-engine/generate-content';

export async function POST(request: Request) {
  try {
    const { organizationId, contentItemIds, modelOverride } = await request.json();

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!contentItemIds || contentItemIds.length === 0) {
      return NextResponse.json({ error: 'No content items specified' }, { status: 400 });
    }

    const result = await generateContentForItems(
      supabase,
      organizationId,
      contentItemIds,
      user.id,
      modelOverride
    );

    if (result.generated === 0 && result.results.length === 0) {
      return NextResponse.json({ error: 'No content items found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
