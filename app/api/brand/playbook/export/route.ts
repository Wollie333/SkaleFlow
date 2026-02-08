import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseBrandOutputs } from '@/lib/playbook/parse-brand-outputs';
import { extractPlaybookTheme } from '@/lib/playbook/playbook-theme';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { BrandOutput } from '@/lib/playbook/parse-brand-outputs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  const supabase = createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
  }

  // Fetch organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, logo_url')
    .eq('id', organizationId)
    .single();

  if (!organization) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Fetch locked outputs
  const { data: rawOutputs } = await supabase
    .from('brand_outputs')
    .select('id, output_key, output_value, is_locked, phase_id')
    .eq('organization_id', organizationId)
    .eq('is_locked', true);

  const outputs: BrandOutput[] = (rawOutputs || []).map(o => ({
    id: o.id,
    output_key: o.output_key,
    output_value: o.output_value,
    is_locked: o.is_locked,
    phase_id: o.phase_id,
  }));

  const data = parseBrandOutputs(outputs);
  const theme = extractPlaybookTheme(data.brand_color_palette, data.brand_typography, data.design_system_colors);

  // Build the HTML
  const cssVars = theme.cssVariables as Record<string, string>;
  const primaryColor = cssVars['--playbook-primary'] || '#1E6B63';
  const darkColor = cssVars['--playbook-dark'] || '#0F1F1D';
  const lightColor = cssVars['--playbook-light'] || '#F0ECE4';
  const neutralColor = cssVars['--playbook-neutral'] || '#7A756D';
  const headingFont = cssVars['--playbook-heading-font'] || 'sans-serif';
  const bodyFont = cssVars['--playbook-body-font'] || 'sans-serif';

  // Collect all output keys that have values
  const sections = [
    {
      num: '01',
      title: 'Brand Substance',
      keys: ['brand_purpose', 'brand_vision', 'brand_mission', 'brand_archetype', 'brand_values', 'brand_characteristics', 'brand_non_negotiables', 'brand_origin_story', 'founder_story'],
    },
    {
      num: '02',
      title: 'Audience & Enemy',
      keys: ['icp_demographics', 'icp_psychographics', 'icp_pains', 'icp_desires', 'icp_emotional_triggers', 'icp_internal_dialogue', 'icp_objections', 'icp_buying_triggers', 'customer_journey_stages', 'enemy_name', 'enemy_type', 'enemy_description', 'enemy_cost', 'enemy_false_promises'],
    },
    {
      num: '03',
      title: 'Offer & Positioning',
      keys: ['offer_name', 'offer_tagline', 'offer_problem', 'offer_outcome', 'offer_inclusions', 'offer_exclusions', 'offer_transformation_before', 'offer_transformation_after', 'positioning_statement', 'differentiation_statement', 'category', 'competitive_landscape', 'lead_magnet_type', 'lead_magnet_title', 'lead_magnet_promise', 'lead_magnet_content_outline'],
    },
    {
      num: '04',
      title: 'Brand Voice & Messaging',
      keys: ['tone_descriptors', 'vocabulary_preferred', 'vocabulary_avoided', 'industry_terms_embrace', 'industry_terms_reject', 'message_core', 'message_pillars'],
    },
    {
      num: '05',
      title: 'Visual Identity',
      keys: ['visual_mood', 'imagery_direction', 'brand_elements', 'visual_inspirations'],
    },
    {
      num: '06',
      title: 'Design System',
      keys: ['design_system_components', 'design_system_animations'],
    },
    {
      num: '07',
      title: 'Website & Copy',
      keys: ['website_role', 'primary_conversion', 'secondary_conversion', 'traffic_sources', 'website_sitemap', 'user_journey', 'content_themes', 'content_pillars', 'beliefs_to_teach', 'homepage_hero', 'homepage_problem', 'homepage_solution', 'homepage_who_we_help', 'homepage_proof', 'homepage_why_us', 'homepage_final_cta', 'sales_page_hero', 'sales_page_story_pain', 'sales_page_turn_enemy', 'sales_page_value_stack', 'sales_page_transformation', 'sales_page_proof', 'sales_page_faq', 'sales_page_final_cta', 'about_page_copy', 'problems_page_copy', 'results_page_copy', 'apply_page_copy', 'form_fields', 'form_cta', 'reassurance', 'lead_page_headline', 'lead_page_copy', 'lead_page_cta'],
    },
    {
      num: '08',
      title: 'Conversion & Authority',
      keys: ['authority_pitch', 'authority_publish_plan', 'authority_product_ecosystem', 'authority_profile_plan', 'authority_partnerships', 'conversion_business_type', 'conversion_strategy', 'conversion_funnel', 'conversion_metrics', 'conversion_flow', 'nurture_sequence', 'authority_assets', 'authority_gaps'],
    },
  ];

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderRow(key: string): string {
    const val = (data as Record<string, unknown>)[key];
    if (!val || (typeof val === 'string' && !val.trim())) return '';
    const { label, description } = getVariableDescription(key);
    const valueStr = typeof val === 'string' ? val : JSON.stringify(val, null, 2);

    return `
      <div class="row">
        <div class="row-label">${escapeHtml(label)}</div>
        <div class="row-content">
          ${description ? `<p class="row-description">${escapeHtml(description)}</p>` : ''}
          <div class="row-value"><pre>${escapeHtml(valueStr)}</pre></div>
        </div>
      </div>`;
  }

  const sectionsHtml = sections.map(s => {
    const rowsHtml = s.keys.map(k => renderRow(k)).filter(Boolean).join('\n');
    if (!rowsHtml) return '';
    return `
      <section class="playbook-section">
        <div class="section-header">
          <span class="section-num">${s.num}</span>
          <h2 class="section-title">${escapeHtml(s.title)}</h2>
        </div>
        ${rowsHtml}
      </section>`;
  }).filter(Boolean).join('\n');

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(organization.name)} - Brand Playbook</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${theme.googleFontsUrl}" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${bodyFont};
      color: ${darkColor};
      background: #fff;
      line-height: 1.6;
    }
    .cover {
      background: ${darkColor};
      color: ${lightColor};
      padding: 120px 60px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .cover-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: ${primaryColor};
      margin-bottom: 24px;
    }
    .cover-title {
      font-family: ${headingFont};
      font-size: 48px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .cover-date {
      margin-top: 24px;
      font-size: 13px;
      color: ${neutralColor};
    }
    .container {
      max-width: 840px;
      margin: 0 auto;
      padding: 60px 40px;
    }
    .playbook-section {
      margin-bottom: 60px;
      page-break-before: always;
    }
    .section-header {
      margin-bottom: 40px;
      border-bottom: 1px solid rgba(122, 117, 109, 0.15);
      padding-bottom: 20px;
    }
    .section-num {
      font-size: 13px;
      font-family: monospace;
      font-weight: 500;
      color: ${primaryColor};
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 8px;
    }
    .section-title {
      font-family: ${headingFont};
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.1;
    }
    .row {
      display: flex;
      gap: 32px;
      padding: 24px 0;
      border-bottom: 1px solid rgba(122, 117, 109, 0.1);
    }
    .row-label {
      width: 30%;
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${primaryColor};
      padding-top: 4px;
    }
    .row-content {
      flex: 1;
      min-width: 0;
    }
    .row-description {
      font-size: 13px;
      color: ${neutralColor};
      margin-bottom: 12px;
      line-height: 1.6;
    }
    .row-value {
      background: rgba(122, 117, 109, 0.04);
      border-radius: 8px;
      padding: 16px 20px;
    }
    .row-value pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: ${bodyFont};
      font-size: 15px;
      line-height: 1.75;
      color: ${darkColor};
    }
    .footer {
      text-align: center;
      padding: 40px;
      font-size: 11px;
      color: ${neutralColor};
    }
    @media print {
      .cover { page-break-after: always; }
      .playbook-section { page-break-before: always; }
      .row { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <p class="cover-label">Brand Playbook</p>
    <h1 class="cover-title">${escapeHtml(organization.name)}</h1>
    <p class="cover-date">${dateStr}</p>
  </div>
  <div class="container">
    ${sectionsHtml}
  </div>
  <div class="footer">
    ${escapeHtml(organization.name)} Brand Playbook &middot; Powered by SkaleFlow
  </div>
</body>
</html>`;

  const slug = organization.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-brand-playbook.html"`,
    },
  });
}
