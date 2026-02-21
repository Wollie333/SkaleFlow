import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { AuditReportDocument } from '@/components/brand-audit/report-pdf/audit-report-document';
import { CATEGORY_ORDER, CATEGORY_LABELS, AUDIT_CREDIT_COSTS } from '@/lib/brand-audit/types';
import type { AuditReportData } from '@/components/brand-audit/report-pdf/audit-report-document';
import type { BrandAuditCategory, BrandAuditRating, Json } from '@/types/database';
import { randomBytes } from 'crypto';
import React from 'react';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Load full audit
    // Try with user join, fall back without
    let audit: Record<string, unknown> | null = null;
    const { data: a1, error: e1 } = await supabase
      .from('brand_audits')
      .select(`
        *,
        crm_contacts (id, first_name, last_name, email, company_id, crm_companies (id, name)),
        users!brand_audits_created_by_fkey (id, full_name),
        brand_audit_scores (category, score, rating, analysis, key_finding, actionable_insight),
        brand_audit_offer_matches (audit_category, priority, relevance_description, offer_id, offers (name))
      `)
      .eq('id', id)
      .single();

    if (!e1) {
      audit = a1;
    } else {
      const { data: a2 } = await supabase
        .from('brand_audits')
        .select(`
          *,
          crm_contacts (id, first_name, last_name, email, company_id, crm_companies (id, name)),
          brand_audit_scores (category, score, rating, analysis, key_finding, actionable_insight),
          brand_audit_offer_matches (audit_category, priority, relevance_description, offer_id, offers (name))
        `)
        .eq('id', id)
        .single();
      audit = a2;
    }

    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    // Cast commonly used fields
    const auditOrgId = audit.organization_id as string;
    const auditStatus = audit.status as string;

    // Verify access
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', auditOrgId)
      .eq('user_id', user.id)
      .single();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!['complete', 'report_generated', 'delivered'].includes(auditStatus)) {
      return NextResponse.json({ error: 'Audit must be scored before generating report' }, { status: 400 });
    }

    // Credit check
    const { isSuperAdmin } = await import('@/lib/ai/credits');
    const isAdmin = await isSuperAdmin(user.id);

    if (!isAdmin) {
      const { requireCredits } = await import('@/lib/ai/middleware');
      const creditCheck = await requireCredits(auditOrgId, 'brand_audit', AUDIT_CREDIT_COSTS.pdf_generation, AUDIT_CREDIT_COSTS.pdf_generation, user.id);
      if (creditCheck) return creditCheck;
    }

    // Get org branding
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', auditOrgId)
      .single();

    const { data: brandOutputs } = await supabase
      .from('brand_outputs')
      .select('output_key, output_value')
      .eq('organization_id', auditOrgId)
      .in('output_key', ['brand_color_palette', 'brand_logo_url']);

    const colorPalette = brandOutputs?.find((b) => b.output_key === 'brand_color_palette');
    let primaryColor = '#0F766E';
    let secondaryColor = '#C9A84C';
    if (colorPalette?.output_value) {
      try {
        const parsed = typeof colorPalette.output_value === 'string' ? JSON.parse(colorPalette.output_value as string) : colorPalette.output_value;
        if (parsed?.primary) primaryColor = parsed.primary;
        if (parsed?.secondary) secondaryColor = parsed.secondary;
      } catch { /* use defaults */ }
    }

    // Build report data
    const contact = audit.crm_contacts as { first_name: string; last_name: string; crm_companies?: { name: string } | null } | null;
    const scores = (audit.brand_audit_scores || []) as Array<{
      category: string; score: number; rating: string;
      analysis: string; key_finding: string; actionable_insight: string;
    }>;
    const offerMatches = (audit.brand_audit_offer_matches || []) as Array<{
      audit_category: string; priority: number; relevance_description: string;
      offers?: { name: string } | null;
    }>;

    const reportData: AuditReportData = {
      auditId: id,
      contactName: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
      companyName: contact?.crm_companies?.name || '',
      overallScore: (audit.overall_score as number) || 0,
      overallRating: ((audit.overall_rating as string) || 'red') as BrandAuditRating,
      executiveSummary: (audit.executive_summary as string) || '',
      categories: CATEGORY_ORDER.map((cat) => {
        const s = scores.find((sc) => sc.category === cat);
        return {
          category: cat,
          score: s?.score || 0,
          rating: (s?.rating || 'red') as BrandAuditRating,
          analysis: s?.analysis || '',
          keyFinding: s?.key_finding || '',
          actionableInsight: s?.actionable_insight || '',
        };
      }),
      roadmap: offerMatches
        .sort((a, b) => a.priority - b.priority)
        .map((m) => ({
          priority: m.priority,
          category: m.audit_category as BrandAuditCategory,
          offerName: m.offers?.name || null,
          relevanceDescription: m.relevance_description || '',
        })),
      branding: {
        primaryColor,
        secondaryColor,
        accentColor: '#C9A84C',
        orgName: org?.name || 'SkaleFlow',
      },
      includePricing: false,
      includeComparison: false,
      aboutText: '',
      generatedDate: new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }),
      preparedBy: (audit.users as { full_name: string } | null)?.full_name || 'SkaleFlow',
    };

    // Request body overrides
    try {
      const body = await request.json();
      if (body.includePricing !== undefined) reportData.includePricing = body.includePricing;
      if (body.aboutText) reportData.aboutText = body.aboutText;
    } catch { /* no body, use defaults */ }

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(AuditReportDocument, { data: reportData }) as any
    );

    // Upload to storage
    const storagePath = `${audit.organization_id}/${id}/brand-audit-report-${Date.now()}.pdf`;
    const { error: uploadError } = await serviceClient.storage
      .from('brand-audit-reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create report record
    const shareToken = randomBytes(24).toString('hex');
    const { data: existingReports } = await serviceClient
      .from('brand_audit_reports')
      .select('version')
      .eq('audit_id', id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = (existingReports?.[0]?.version || 0) + 1;

    const { data: report, error: reportError } = await serviceClient
      .from('brand_audit_reports')
      .insert({
        audit_id: id,
        organization_id: auditOrgId,
        version: nextVersion,
        storage_path: storagePath,
        file_size_bytes: pdfBuffer.length,
        share_token: shareToken,
        brand_snapshot: { primaryColor, secondaryColor } as unknown as Json,
        include_pricing: reportData.includePricing,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Update audit status
    await serviceClient
      .from('brand_audits')
      .update({ status: 'report_generated' })
      .eq('id', id);

    // Deduct credits
    if (!isAdmin) {
      const { deductCredits } = await import('@/lib/ai/server');
      await deductCredits(auditOrgId, user.id, AUDIT_CREDIT_COSTS.pdf_generation, null, 'Brand audit PDF generation');
    }

    return NextResponse.json({
      report,
      shareToken,
      downloadUrl: `/api/brand-audits/${id}/report?download=true&reportId=${report.id}`,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const download = searchParams.get('download');

    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get latest report or specific one
    let query = serviceClient
      .from('brand_audit_reports')
      .select('*')
      .eq('audit_id', id);

    if (reportId) {
      query = query.eq('id', reportId);
    } else {
      query = query.order('version', { ascending: false }).limit(1);
    }

    const { data: reports } = await query;
    const report = reports?.[0];

    if (!report) return NextResponse.json({ error: 'No report found' }, { status: 404 });

    if (download === 'true') {
      // Download the PDF
      const { data: fileData, error: downloadError } = await serviceClient.storage
        .from('brand-audit-reports')
        .download(report.storage_path);

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'Failed to download report' }, { status: 500 });
      }

      const buffer = await fileData.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="brand-audit-report-v${report.version}.pdf"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
