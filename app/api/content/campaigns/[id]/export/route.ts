import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CONTENT_TYPES, type ContentTypeId } from '@/config/content-types';

// GET — Export campaign data (design briefs, scripts, calendar)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json | csv | brief

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, name, objective, start_date, end_date')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all posts
    const { data: posts } = await supabase
      .from('content_posts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('scheduled_date', { ascending: true });

    if (!posts) {
      return NextResponse.json({ error: 'No posts found' }, { status: 404 });
    }

    if (format === 'csv') {
      return exportCSV(campaign, posts);
    }

    if (format === 'brief') {
      return exportBriefs(campaign, posts);
    }

    // Default: full JSON export
    return NextResponse.json({
      campaign,
      posts: posts.map(p => ({
        id: p.id,
        content_type: p.content_type,
        content_type_name: p.content_type_name,
        platform: p.platform,
        format: p.format,
        scheduled_date: p.scheduled_date,
        scheduled_time: p.scheduled_time,
        topic: p.topic,
        hook: p.hook,
        body: p.body,
        cta: p.cta,
        caption: p.caption,
        hashtags: p.hashtags,
        visual_brief: p.visual_brief,
        shot_suggestions: p.shot_suggestions,
        slide_content: p.slide_content,
        on_screen_text: p.on_screen_text,
        status: p.status,
        brand_voice_score: p.brand_voice_score,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function exportCSV(campaign: any, posts: any[]): NextResponse {
  const headers = [
    'Date', 'Time', 'Platform', 'Format', 'Content Type', 'Topic', 'Hook',
    'Body', 'CTA', 'Caption', 'Hashtags', 'Status', 'Voice Score',
  ];

  const rows = posts.map(p => [
    p.scheduled_date || '',
    p.scheduled_time || '',
    p.platform,
    p.format,
    `T${p.content_type} ${p.content_type_name}`,
    csvEscape(p.topic || ''),
    csvEscape(p.hook || ''),
    csvEscape(p.body || ''),
    csvEscape(p.cta || ''),
    csvEscape(p.caption || ''),
    (p.hashtags || []).join(' '),
    p.status,
    p.brand_voice_score || '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${campaign.name.replace(/[^a-z0-9]/gi, '_')}_export.csv"`,
    },
  });
}

function exportBriefs(campaign: any, posts: any[]): NextResponse {
  const briefs = posts
    .filter(p => p.status !== 'idea' && p.topic)
    .map((p, idx) => {
      const ct = CONTENT_TYPES[p.content_type as ContentTypeId];
      const sections = [
        `═══ POST ${idx + 1} ═══`,
        `Date: ${p.scheduled_date || 'TBD'} ${p.scheduled_time || ''}`,
        `Platform: ${p.platform} | Format: ${p.format}`,
        `Content Type: T${p.content_type} ${ct?.name || p.content_type_name}`,
        '',
        `📌 TOPIC: ${p.topic || 'TBD'}`,
        '',
        `🎣 HOOK: ${p.hook || 'TBD'}`,
        '',
        `📝 BODY:`,
        p.body || 'Not yet generated.',
        '',
        `📣 CTA: ${p.cta || 'TBD'}`,
        '',
        `📱 CAPTION:`,
        p.caption || 'Not yet generated.',
        '',
        `#️⃣ HASHTAGS: ${(p.hashtags || []).join(' ')}`,
      ];

      if (p.visual_brief) {
        sections.push('', `🎨 VISUAL BRIEF:`, p.visual_brief);
      }
      if (p.shot_suggestions) {
        sections.push('', `🎬 SHOT SUGGESTIONS:`, p.shot_suggestions);
      }

      return sections.join('\n');
    });

  const doc = [
    `CAMPAIGN: ${campaign.name}`,
    `OBJECTIVE: ${campaign.objective}`,
    `DATE RANGE: ${campaign.start_date} — ${campaign.end_date || 'Ongoing'}`,
    `TOTAL POSTS: ${posts.length}`,
    '',
    '═'.repeat(60),
    '',
    ...briefs.map(b => b + '\n\n' + '─'.repeat(60) + '\n'),
  ].join('\n');

  return new NextResponse(doc, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${campaign.name.replace(/[^a-z0-9]/gi, '_')}_briefs.txt"`,
    },
  });
}

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
