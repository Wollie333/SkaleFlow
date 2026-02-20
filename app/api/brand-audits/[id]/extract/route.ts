import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildCallExtractionPrompt } from '@/lib/brand-audit/prompts';
import { SECTION_ORDER, SECTION_LABELS, AUDIT_CREDIT_COSTS } from '@/lib/brand-audit/types';
import type { BrandAuditSectionKey } from '@/types/database';

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
    const { transcriptText, sectionKey, context = '' } = body;

    if (!transcriptText || typeof transcriptText !== 'string') {
      return NextResponse.json({ error: 'transcriptText is required' }, { status: 400 });
    }

    // Load existing section data for context
    const { data: sections } = await supabase
      .from('brand_audit_sections')
      .select('section_key, data')
      .eq('audit_id', id);

    const existingSectionData: Record<string, Record<string, unknown>> = {};
    for (const s of (sections || [])) {
      existingSectionData[s.section_key] = (s.data || {}) as Record<string, unknown>;
    }

    // Determine current phase from sectionKey or default
    const currentPhase = sectionKey
      ? SECTION_LABELS[sectionKey as BrandAuditSectionKey] || 'General Discovery'
      : 'General Discovery';

    // Dynamic imports (same pattern as input-assistance.ts)
    const { resolveModel, deductCredits } = await import('@/lib/ai/server');
    const { getProviderAdapterForUser } = await import('@/lib/ai/providers/registry');
    const { isSuperAdmin } = await import('@/lib/ai/credits');

    const isAdmin = await isSuperAdmin(user.id);

    if (!isAdmin) {
      const { requireCredits } = await import('@/lib/ai/middleware');
      const creditCheck = await requireCredits(
        audit.organization_id,
        'brand_audit',
        AUDIT_CREDIT_COSTS.section_refine,
        AUDIT_CREDIT_COSTS.section_refine,
        user.id
      );
      if (creditCheck) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
      }
    }

    // Resolve model and get adapter
    const resolved = await resolveModel(audit.organization_id, 'brand_chat', undefined, user.id);
    const { adapter, usingUserKey } = await getProviderAdapterForUser(resolved.provider, user.id);

    // Build prompt and call AI
    const prompt = buildCallExtractionPrompt(transcriptText, existingSectionData, currentPhase);

    const response = await adapter.complete({
      messages: [{ role: 'user', content: prompt }],
      modelId: resolved.modelId,
      maxTokens: 2000,
      temperature: 0.3,
    });

    // Deduct credits if not super admin and not using user key
    if (!isAdmin && !usingUserKey) {
      const { calculateCreditCost } = await import('@/lib/ai/credits');
      const credits = calculateCreditCost(resolved.id, response.inputTokens, response.outputTokens);
      await deductCredits(
        audit.organization_id,
        user.id,
        credits,
        null,
        `Brand audit live extraction for ${id}`
      );
    }

    // Parse response
    const content = response.text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const extractions: Array<{
      key: string;
      value: unknown;
      section: string;
      confidence: number;
      label: string;
    }> = [];

    // Normalize the response format
    if (parsed.extractions && Array.isArray(parsed.extractions)) {
      for (const ext of parsed.extractions) {
        const sectionForField = ext.section_key || ext.section;
        if (sectionForField && SECTION_ORDER.includes(sectionForField as BrandAuditSectionKey)) {
          extractions.push({
            key: ext.field || ext.key,
            value: ext.value,
            section: sectionForField,
            confidence: ext.confidence || 0.7,
            label: ext.field || ext.key,
          });
        }
      }
    }

    return NextResponse.json({ extractions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extract';
    console.error('Error extracting from transcript:', error);

    if (message.includes('Insufficient credits')) {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
