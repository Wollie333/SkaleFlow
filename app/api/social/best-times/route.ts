import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeOptimalPostingTimes } from '@/lib/social/best-time-analyzer';

// GET /api/social/best-times - Get best posting times for platforms
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform) {
      // Get all platforms
      const { data, error } = await supabase
        .from('posting_schedule_analysis')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .order('analyzed_at', { ascending: false });

      if (error) {
        console.error('Error fetching best times:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Get specific platform
    const { data, error } = await supabase
      .from('posting_schedule_analysis')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('platform', platform)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching best times:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No analysis found for this platform', needsAnalysis: true },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in GET /api/social/best-times:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
