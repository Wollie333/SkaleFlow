'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { buildTrackedUrl, type UTMParams } from '@/lib/utm/generate-utm';
import type { ContentStatus } from '@/types/database';

interface ContentItem {
  id: string;
  topic?: string | null;
  hook?: string | null;
  script_body?: string | null;
  cta?: string | null;
  caption?: string | null;
  hashtags?: string[] | null;
  platforms: string[];
  format: string;
  funnel_stage: string;
  storybrand_stage: string;
  filming_notes?: string | null;
  scheduled_date: string;
  status: ContentStatus;
  media_urls?: string[] | null;
  context_section?: string | null;
  teaching_points?: string | null;
  reframe?: string | null;
  problem_expansion?: string | null;
  framework_teaching?: string | null;
  case_study?: string | null;
  target_url?: string | null;
  utm_parameters?: Record<string, string> | null;
  [key: string]: unknown;
}

interface ContentBriefProps {
  item: ContentItem;
  organizationId: string;
}

export function ContentBrief({ item, organizationId }: ContentBriefProps) {
  const [orgName, setOrgName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();
      if (data) setOrgName(data.name);
    }
    load();
  }, [organizationId, supabase]);

  const handleExportBrief = () => {
    const w = window.open('', '_blank');
    if (!w) return;

    // Build script sections (only non-empty ones)
    const scriptSections: Array<{ label: string; value: string; type?: string }> = [];
    // Helper: format text as bulleted list (one sentence per line)
    const formatAsBullets = (text: string): string => {
      // Split on sentence endings or newlines
      const sentences = text
        .split(/(?<=[.!?])\s+|\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      if (sentences.length <= 1) return text;
      return '<ul style="list-style:disc;padding-left:20px;margin:0;">' +
        sentences.map(s => `<li style="margin-bottom:6px;line-height:1.5;">${s}</li>`).join('') +
        '</ul>';
    };

    if (item.hook) scriptSections.push({ label: 'Hook', value: item.hook, type: 'hook' });
    if (item.context_section) scriptSections.push({ label: 'Context', value: formatAsBullets(item.context_section) });
    if (item.teaching_points) scriptSections.push({ label: 'Teaching Points', value: formatAsBullets(item.teaching_points) });
    if (item.script_body) {
      // Check if script_body is JSON (carousel/static)
      try {
        const parsed = JSON.parse(item.script_body);
        if (Array.isArray(parsed)) {
          // Carousel slides
          scriptSections.push({ label: 'Slides', value: parsed.map((s: { slide_number: number; text: string; visual_direction?: string }) =>
            `<strong>Slide ${s.slide_number}:</strong> ${s.text}${s.visual_direction ? `<br/><em style="color:#888;font-size:13px;">Visual: ${s.visual_direction}</em>` : ''}`
          ).join('<br/><br/>') });
        } else if (parsed.headline) {
          // Static content
          if (parsed.headline) scriptSections.push({ label: 'Headline', value: parsed.headline });
          if (parsed.body_text) scriptSections.push({ label: 'Body Text', value: formatAsBullets(parsed.body_text) });
          if (parsed.visual_direction) scriptSections.push({ label: 'Visual Direction', value: parsed.visual_direction });
        }
      } catch {
        scriptSections.push({ label: 'Script Body', value: formatAsBullets(item.script_body) });
      }
    }
    if (item.problem_expansion) scriptSections.push({ label: 'Problem Expansion', value: formatAsBullets(item.problem_expansion) });
    if (item.framework_teaching) scriptSections.push({ label: 'Framework Teaching', value: formatAsBullets(item.framework_teaching) });
    if (item.case_study) scriptSections.push({ label: 'Case Study', value: formatAsBullets(item.case_study) });
    if (item.reframe) scriptSections.push({ label: 'Reframe', value: formatAsBullets(item.reframe) });
    if (item.cta) scriptSections.push({ label: 'CTA', value: item.cta, type: 'cta' });

    const trackedUrl = item.target_url && item.utm_parameters
      ? buildTrackedUrl(item.target_url, item.utm_parameters as unknown as UTMParams)
      : null;

    const html = `<!DOCTYPE html>
<html><head>
<title>Content Brief - ${item.topic || 'Untitled'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 800px; margin: 40px auto; padding: 20px; color: #333;
    line-height: 1.6;
  }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #888; font-size: 14px; margin-bottom: 16px; }
  .meta { display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap; }
  .meta span { background: #f5f5f5; padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #555; }

  /* THE SCRIPT section */
  .script-box {
    border-left: 4px solid #2dd4bf;
    background: #f0fdfa;
    border-radius: 0 12px 12px 0;
    padding: 24px;
    margin: 24px 0;
  }
  .script-box h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2dd4bf; margin-bottom: 16px; }
  .script-section { margin-bottom: 16px; }
  .script-section:last-child { margin-bottom: 0; }
  .script-section h3 { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 0.5px; margin-bottom: 6px; }
  .script-section p { white-space: pre-wrap; font-size: 15px; }
  .script-section ul { font-size: 15px; }
  .script-section ul li { font-size: 15px; color: #333; }
  .hook-text { font-size: 20px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
  .cta-section {
    border-left: 3px solid #d4a530;
    padding-left: 16px;
    margin-top: 16px;
  }
  .cta-section p { font-weight: 600; color: #1a1a1a; }
  .separator { border: 0; border-top: 1px solid #e5e5e5; margin: 12px 0; }

  /* FOR CREATOR section */
  .creator-box {
    background: #f5f5f5;
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  .creator-box h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 12px; }
  .creator-box p { white-space: pre-wrap; font-size: 14px; color: #555; }

  /* POST DETAILS section */
  .post-details { margin: 24px 0; }
  .post-details h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 16px; }
  .detail-row { margin-bottom: 12px; }
  .detail-row h3 { font-size: 11px; text-transform: uppercase; color: #aaa; letter-spacing: 0.5px; margin-bottom: 4px; }
  .detail-row p { font-size: 14px; white-space: pre-wrap; }
  .url-preview { font-size: 12px; color: #2dd4bf; word-break: break-all; background: #f5f5f5; padding: 8px 12px; border-radius: 8px; }

  /* Media */
  .media-section { margin: 24px 0; }
  .media-section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 12px; }
  .media-grid { display: flex; gap: 8px; flex-wrap: wrap; }
  .media-grid img { max-width: 200px; max-height: 150px; border-radius: 8px; }

  /* Print button */
  .print-btn {
    position: fixed; top: 16px; right: 16px;
    background: #2dd4bf; color: white; border: none;
    padding: 8px 20px; border-radius: 8px; cursor: pointer;
    font-size: 14px; font-weight: 500;
  }
  .print-btn:hover { background: #14b8a6; }

  /* Print styles */
  @media print {
    body { margin: 20px; max-width: 100%; }
    .print-btn { display: none; }
    .script-box { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f0fdfa !important; }
    .creator-box { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f5f5f5 !important; }
    .cta-section { border-left-color: #d4a530 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .meta span { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f5f5f5 !important; }
    @page { margin: 1.5cm; size: A4; }
  }
</style>
</head><body>
<button class="print-btn" onclick="window.print()">Save as PDF</button>

<h1>${orgName || 'Content Brief'}</h1>
<div class="subtitle">${item.topic || 'Untitled'}</div>
<div class="meta">
  <span>${item.format.replace(/_/g, ' ')}</span>
  <span>${item.funnel_stage}</span>
  <span>${item.storybrand_stage.replace(/_/g, ' ')}</span>
  <span>${item.platforms.join(', ')}</span>
  <span>${format(new Date(item.scheduled_date), 'MMM d, yyyy')}</span>
  <span>Status: ${item.status.replace(/_/g, ' ')}</span>
</div>

${scriptSections.length > 0 ? `
<div class="script-box">
  <h2>The Script</h2>
  ${scriptSections.map(s => {
    if (s.type === 'hook') {
      return `<div class="script-section"><h3>${s.label}</h3><p class="hook-text">${s.value}</p></div>`;
    }
    if (s.type === 'cta') {
      return `<div class="cta-section"><h3 style="font-size:11px;text-transform:uppercase;color:#999;letter-spacing:0.5px;margin-bottom:6px;">${s.label}</h3><p>${s.value}</p></div>`;
    }
    return `<div class="script-section"><h3>${s.label}</h3><div>${s.value}</div></div><hr class="separator"/>`;
  }).join('')}
</div>
` : ''}

${item.filming_notes ? `
<div class="creator-box">
  <h2>For Creator</h2>
  <p>${item.filming_notes}</p>
</div>
` : ''}

<div class="post-details">
  <h2>Post Details</h2>
  ${item.caption ? `<div class="detail-row"><h3>Post Description</h3><p>${item.caption}</p></div>` : ''}
  ${item.target_url ? `<div class="detail-row"><h3>Target URL</h3><p>${item.target_url}</p></div>` : ''}
  ${trackedUrl ? `<div class="detail-row"><h3>Full Tracked URL</h3><p class="url-preview">${trackedUrl}</p></div>` : ''}
  ${item.hashtags && item.hashtags.length > 0 ? `<div class="detail-row"><h3>Hashtags</h3><p>${item.hashtags.map(h => '#' + h).join(' ')}</p></div>` : ''}
</div>

${item.media_urls && item.media_urls.length > 0 ? `
<div class="media-section">
  <h2>Attached Media</h2>
  <div class="media-grid">
    ${item.media_urls.map(url => `<img src="${url}" />`).join('')}
  </div>
</div>` : ''}
</body></html>`;

    w.document.write(html);
    w.document.close();
  };

  return (
    <button
      onClick={handleExportBrief}
      className="text-xs text-teal hover:text-teal/80 flex items-center gap-1"
    >
      Export Brief
    </button>
  );
}
