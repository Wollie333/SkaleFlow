import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRoadmap } from '@/lib/brand-audit/offer-matching';

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

    if (!['complete', 'report_generated', 'delivered'].includes(audit.status)) {
      return NextResponse.json({ error: 'Audit must be scored before generating roadmap' }, { status: 400 });
    }

    const roadmap = await generateRoadmap(id, audit.organization_id, user.id);

    return NextResponse.json({ roadmap });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate roadmap';
    console.error('Error generating roadmap:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
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
    if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', audit.organization_id)
      .eq('user_id', user.id)
      .single();
    if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { data: matches } = await supabase
      .from('brand_audit_offer_matches')
      .select('*, offers (id, name, description, price_display, service_tags)')
      .eq('audit_id', id)
      .order('priority', { ascending: true });

    return NextResponse.json(matches || []);
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 });
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

    const body = await request.json();
    const { category, offer_id } = body;

    const { data: audit } = await supabase
      .from('brand_audits')
      .select('organization_id')
      .eq('id', id)
      .single();
    if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', audit.organization_id)
      .eq('user_id', user.id)
      .single();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('brand_audit_offer_matches')
      .update({ offer_id, is_user_override: true })
      .eq('audit_id', id)
      .eq('audit_category', category)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating roadmap:', error);
    return NextResponse.json({ error: 'Failed to update roadmap' }, { status: 500 });
  }
}
