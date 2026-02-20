import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceClient();

    // Find report by share token
    const { data: report } = await supabase
      .from('brand_audit_reports')
      .select('audit_id, organization_id, share_expires_at')
      .eq('share_token', token)
      .single();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check expiry
    if (report.share_expires_at && new Date(report.share_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Report link has expired' }, { status: 404 });
    }

    // Update last viewed timestamp
    await supabase
      .from('brand_audit_reports')
      .update({
        last_viewed_at: new Date().toISOString(),
      })
      .eq('share_token', token);

    // Load audit data
    const { data: audit } = await supabase
      .from('brand_audits')
      .select(`
        overall_score,
        overall_rating,
        executive_summary,
        created_at,
        crm_contacts (first_name, last_name),
        brand_audit_scores (category, score, rating, analysis, key_finding, actionable_insight)
      `)
      .eq('id', report.audit_id)
      .single();

    if (!audit) {
      return NextResponse.json({ error: 'Audit data not found' }, { status: 404 });
    }

    // Get org name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', report.organization_id)
      .single();

    return NextResponse.json({
      audit: {
        overall_score: audit.overall_score,
        overall_rating: audit.overall_rating,
        executive_summary: audit.executive_summary,
        created_at: audit.created_at,
      },
      contact: audit.crm_contacts || null,
      scores: audit.brand_audit_scores || [],
      org,
    });
  } catch (error) {
    console.error('Error fetching shared report:', error);
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 });
  }
}
