import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeWebsite } from '@/lib/brand-audit/website-analysis';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: audit } = await supabase
      .from('brand_audits')
      .select('organization_id')
      .eq('id', id)
      .single();
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', audit.organization_id)
      .eq('user_id', user.id)
      .single();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { url } = body;
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const result = await analyzeWebsite(url, id, audit.organization_id, user.id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Website analysis failed';
    console.error('Error analyzing website:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
