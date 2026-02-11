import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { suggestBestTime } from '@/lib/social/best-time-analyzer';

// POST /api/social/best-times/suggest - Get best time suggestion for content
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
    const { platforms, preferredDate } = body;

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Platforms are required' }, { status: 400 });
    }

    // Get suggestion
    const suggestion = await suggestBestTime(
      userData.organization_id,
      platforms,
      preferredDate
    );

    if (!suggestion) {
      return NextResponse.json(
        {
          error: 'No best time data available. Please publish more content first.',
          needsMoreData: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: suggestion });
  } catch (error: any) {
    console.error('Error in POST /api/social/best-times/suggest:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
