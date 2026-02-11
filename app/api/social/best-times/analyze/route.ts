import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeOptimalPostingTimes } from '@/lib/social/best-time-analyzer';

// POST /api/social/best-times/analyze - Trigger analysis for a platform
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    // Run analysis
    const analysis = await analyzeOptimalPostingTimes(userData.organization_id, platform);

    if (!analysis) {
      return NextResponse.json(
        {
          error: 'Not enough data to analyze. Need at least 10 published posts.',
          needsMoreData: true,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: analysis });
  } catch (error: any) {
    console.error('Error in POST /api/social/best-times/analyze:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
