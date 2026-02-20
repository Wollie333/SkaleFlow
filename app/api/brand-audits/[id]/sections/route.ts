import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify access via audit's org
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
    if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { data: sections, error } = await supabase
      .from('brand_audit_sections')
      .select('*')
      .eq('audit_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(sections || []);
  } catch (error) {
    console.error('Error fetching audit sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}
