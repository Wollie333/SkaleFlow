import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refineSection } from '@/lib/brand-audit/input-assistance';
import { SECTION_ORDER } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  try {
    const { id, key } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!SECTION_ORDER.includes(key as BrandAuditSectionKey)) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

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

    const body = await request.json();
    const { rawData, businessContext = '' } = body;

    if (!rawData) {
      return NextResponse.json({ error: 'rawData is required' }, { status: 400 });
    }

    const result = await refineSection(
      key as BrandAuditSectionKey,
      rawData,
      businessContext,
      audit.organization_id,
      user.id
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to refine section';
    console.error('Error refining section:', error);

    if (message.includes('Insufficient credits')) {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
