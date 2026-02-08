import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkCredits } from '@/lib/ai';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const balance = await checkCredits(organizationId, 0, user.id);

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
