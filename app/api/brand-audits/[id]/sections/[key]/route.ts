import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SECTION_ORDER } from '@/lib/brand-audit/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  try {
    const { id, key } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate section key
    if (!SECTION_ORDER.includes(key as typeof SECTION_ORDER[number])) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    // Verify access
    const { data: audit } = await supabase
      .from('brand_audits')
      .select('organization_id, status')
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
    const { data, is_complete, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (data !== undefined) updateData.data = data;
    if (is_complete !== undefined) updateData.is_complete = is_complete;
    if (notes !== undefined) updateData.notes = notes;

    // Update section
    const { data: section, error } = await supabase
      .from('brand_audit_sections')
      .update(updateData)
      .eq('audit_id', id)
      .eq('section_key', key as any)
      .select()
      .single();

    if (error) throw error;

    // Recount completed sections and update audit
    const { data: allSections } = await supabase
      .from('brand_audit_sections')
      .select('is_complete')
      .eq('audit_id', id);

    const completedCount = (allSections || []).filter((s) => s.is_complete).length;

    await supabase
      .from('brand_audits')
      .update({ sections_completed: completedCount })
      .eq('id', id);

    // Auto-transition draft → in_progress on first section save
    if (audit.status === 'draft' && completedCount > 0) {
      await supabase
        .from('brand_audits')
        .update({ status: 'in_progress' })
        .eq('id', id);
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error updating audit section:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}
