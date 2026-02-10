import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validateMetaCreative, getComplianceStatus } from '@/lib/marketing/compliance/meta-validator';
import type { ComplianceIssue } from '@/lib/marketing/compliance/shared-rules';
import type { Json } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Get creative with campaign info
  const { data: creative, error: fetchError } = await supabase
    .from('ad_creatives')
    .select('*, ad_campaigns(platform, special_ad_category)')
    .eq('id', id)
    .single();

  if (fetchError || !creative) {
    return NextResponse.json({ error: 'Creative not found' }, { status: 404 });
  }

  // Verify membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', creative.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!member) return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });

  let issues: ComplianceIssue[] = [];
  const campaign = creative.ad_campaigns;
  const platform = campaign?.platform || 'meta';

  try {
    // Get targeting config from ad set if available
    let targetingConfig = null;
    if (creative.ad_set_id) {
      const { data: adSet } = await supabase
        .from('ad_sets')
        .select('targeting_config')
        .eq('id', creative.ad_set_id)
        .single();
      targetingConfig = adSet?.targeting_config || null;
    }

    if (platform === 'meta') {
      issues = await validateMetaCreative({
        primaryText: creative.primary_text || '',
        headline: creative.headline,
        description: creative.description,
        ctaType: creative.cta_type,
        targetUrl: creative.target_url || '',
        mediaUrls: creative.media_urls || [],
        specialAdCategory: campaign?.special_ad_category || null,
        targetingConfig: targetingConfig as any,
      });
    } else if (platform === 'tiktok') {
      // TikTok validation - run shared rules with TikTok-specific limits
      issues = [];

      // TikTok primary text limit
      const primaryText = creative.primary_text || '';
      if (primaryText.length > 100) {
        issues.push({
          type: 'character_limit',
          severity: 'error',
          field: 'primary_text',
          message: `Ad description is ${primaryText.length} characters (TikTok max: 100).`,
          recommendation: 'Shorten the ad description to 100 characters or fewer.',
        });
      }

      // Run shared prohibited content checks
      const { checkProhibitedContent } = await import('@/lib/marketing/compliance/shared-rules');
      issues.push(...checkProhibitedContent(primaryText, 'primary_text'));

      // TikTok requires a target URL
      if (!creative.target_url) {
        issues.push({
          type: 'missing_field',
          severity: 'error',
          field: 'target_url',
          message: 'Target URL is required for TikTok ads.',
        });
      }
    }

    const complianceStatus = getComplianceStatus(issues);

    // Update the creative with compliance results
    const serviceClient = createServiceClient();
    await serviceClient
      .from('ad_creatives')
      .update({
        compliance_status: complianceStatus,
        compliance_issues: issues as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      complianceStatus,
      issues,
      issueCount: issues.length,
      errorCount: issues.filter(i => i.severity === 'error').length,
      warningCount: issues.filter(i => i.severity === 'warning').length,
    });
  } catch (err) {
    console.error('Compliance validation error:', err);
    const message = err instanceof Error ? err.message : 'Validation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
