import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidTransition } from '@/lib/brand-audit/state-machine';
import type { BrandAuditStatus } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Try with user join first, fall back without if FK not resolved
    let audit: Record<string, unknown> | null = null;
    let fetchError: unknown = null;

    const { data: auditData, error: err1 } = await supabase
      .from('brand_audits')
      .select(`
        *,
        crm_contacts (id, first_name, last_name, email, phone, company_id, crm_companies (id, name)),
        users!brand_audits_created_by_fkey (id, full_name, email),
        brand_audit_sections (id, section_key, data, is_complete, data_source, extraction_confidence, notes),
        brand_audit_scores (id, category, score, rating, weight, analysis, key_finding, actionable_insight, evidence)
      `)
      .eq('id', id)
      .single();

    if (!err1) {
      audit = auditData;
    } else {
      // FK to auth.users may not be resolvable — retry without user join
      const { data: auditFallback, error: err2 } = await supabase
        .from('brand_audits')
        .select(`
          *,
          crm_contacts (id, first_name, last_name, email, phone, company_id, crm_companies (id, name)),
          brand_audit_sections (id, section_key, data, is_complete, data_source, extraction_confidence, notes),
          brand_audit_scores (id, category, score, rating, weight, analysis, key_finding, actionable_insight, evidence)
        `)
        .eq('id', id)
        .single();

      if (err2) fetchError = err2;
      else audit = auditFallback;
    }

    if (fetchError) throw fetchError;
    if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', audit.organization_id)
      .eq('user_id', user.id)
      .single();
    if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Normalize
    const normalized = {
      ...audit,
      contact: audit.crm_contacts || null,
      creator: audit.users || null,
      sections: audit.brand_audit_sections || [],
      scores: audit.brand_audit_scores || [],
      crm_contacts: undefined,
      users: undefined,
      brand_audit_sections: undefined,
      brand_audit_scores: undefined,
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching brand audit:', error);
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch current audit
    const { data: current, error: fetchError } = await supabase
      .from('brand_audits')
      .select('organization_id, status')
      .eq('id', id)
      .single();
    if (fetchError || !current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify owner/admin
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', current.organization_id)
      .eq('user_id', user.id)
      .single();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status, executive_summary, settings, contact_id } = body;

    // Validate status transition
    if (status && status !== current.status) {
      if (!isValidTransition(current.status as BrandAuditStatus, status as BrandAuditStatus)) {
        return NextResponse.json(
          { error: `Invalid transition from ${current.status} to ${status}` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (executive_summary !== undefined) updateData.executive_summary = executive_summary;
    if (settings !== undefined) updateData.settings = settings;
    if (contact_id !== undefined) updateData.contact_id = contact_id;

    const { data: updated, error: updateError } = await supabase
      .from('brand_audits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating brand audit:', error);
    return NextResponse.json({ error: 'Failed to update audit' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch current audit
    const { data: current } = await supabase
      .from('brand_audits')
      .select('organization_id')
      .eq('id', id)
      .single();
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify owner/admin
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', current.organization_id)
      .eq('user_id', user.id)
      .single();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft-delete: set to abandoned
    const { error } = await supabase
      .from('brand_audits')
      .update({ status: 'abandoned' })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand audit:', error);
    return NextResponse.json({ error: 'Failed to delete audit' }, { status: 500 });
  }
}
