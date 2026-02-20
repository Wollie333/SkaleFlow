import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SECTION_ORDER } from '@/lib/brand-audit/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    if (!organizationId) return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });

    // Verify membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Build query
    let query = supabase
      .from('brand_audits')
      .select(`
        *,
        crm_contacts (id, first_name, last_name, email, company_id, crm_companies (id, name)),
        users!brand_audits_created_by_fkey (id, full_name, email)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Filters
    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as any);

    const contactId = searchParams.get('contactId');
    if (contactId) query = query.eq('contact_id', contactId);

    const source = searchParams.get('source');
    if (source) query = query.eq('source', source as any);

    const { data: audits, error } = await query;
    if (error) throw error;

    // Normalize joins
    const normalized = (audits || []).map((a: Record<string, unknown>) => ({
      ...a,
      contact: a.crm_contacts || null,
      creator: a.users || null,
      crm_contacts: undefined,
      users: undefined,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching brand audits:', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { organizationId, contactId, source = 'manual', settings } = body;

    if (!organizationId) return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });

    // Verify owner/admin
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create the audit
    const { data: audit, error: auditError } = await supabase
      .from('brand_audits')
      .insert({
        organization_id: organizationId,
        contact_id: contactId || null,
        created_by: user.id,
        source,
        settings: settings || {},
      })
      .select()
      .single();

    if (auditError) throw auditError;

    // Create 8 empty sections
    const sections = SECTION_ORDER.map((key) => ({
      audit_id: audit.id,
      section_key: key,
      data: {},
      is_complete: false,
    }));

    const { error: sectionsError } = await supabase
      .from('brand_audit_sections')
      .insert(sections);

    if (sectionsError) throw sectionsError;

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('Error creating brand audit:', error);
    return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 });
  }
}
