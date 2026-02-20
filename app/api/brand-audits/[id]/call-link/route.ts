import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { callId } = body;
    if (!callId) return NextResponse.json({ error: 'callId required' }, { status: 400 });

    // Verify access
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

    // Link call to audit
    const { data: updated, error } = await supabase
      .from('brand_audits')
      .update({
        call_id: callId,
        source: 'call',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error linking call:', error);
    return NextResponse.json({ error: 'Failed to link call' }, { status: 500 });
  }
}
