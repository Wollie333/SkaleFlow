import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { organizationId, contentItemIds } = await request.json();

    const supabase = createClient();

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get brand context
    const { data: outputs } = await supabase
      .from('brand_outputs')
      .select('output_key, output_value')
      .eq('organization_id', organizationId)
      .eq('is_locked', true);

    const brandContext = buildBrandContext(outputs || []);

    // Get organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    // Get content items
    const { data: items } = await supabase
      .from('content_items')
      .select(`
        *,
        angle:content_angles(name, emotional_target)
      `)
      .in('id', contentItemIds);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No content items found' }, { status: 404 });
    }

    const results = [];

    for (const item of items) {
      const prompt = buildContentPrompt(brandContext, item, org?.name || 'Your Brand');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      const generatedContent = parseContentResponse(responseText);

      // Update content item
      await supabase
        .from('content_items')
        .update({
          topic: generatedContent.topic,
          hook: generatedContent.hook,
          script_body: generatedContent.script_body,
          cta: generatedContent.cta,
          caption: generatedContent.caption,
          ai_generated: true,
          ai_model: 'claude-sonnet-4-20250514',
          status: 'scripted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      // Track usage
      await supabase
        .from('ai_usage')
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          feature: 'content_generation',
          model: 'claude-sonnet-4-20250514',
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        });

      results.push({
        id: item.id,
        content: generatedContent,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

function buildBrandContext(outputs: Array<{ output_key: string; output_value: unknown }>) {
  const context: Record<string, unknown> = {};

  for (const output of outputs) {
    context[output.output_key] = output.output_value;
  }

  return context;
}

function buildContentPrompt(
  brandContext: Record<string, unknown>,
  item: {
    funnel_stage: string;
    storybrand_stage: string;
    format: string;
    platforms: string[];
    angle?: { name: string; emotional_target: string } | null;
  },
  orgName: string
): string {
  return `You are a content writer for ${orgName}. Write social media content that is direct, authentic, and conversion-focused.

## BRAND CONTEXT

${Object.keys(brandContext).length > 0 ? JSON.stringify(brandContext, null, 2) : 'No brand context available - write general professional content.'}

## CONTENT PARAMETERS

**Funnel Stage:** ${item.funnel_stage}
${getFunnelGuidance(item.funnel_stage)}

**StoryBrand Stage:** ${item.storybrand_stage}
${getStoryBrandGuidance(item.storybrand_stage)}

**Weekly Angle:** ${item.angle?.name || 'General'}
${item.angle ? `Emotional target: ${item.angle.emotional_target}` : ''}

**Format:** ${item.format}
${getFormatGuidance(item.format)}

**Platforms:** ${item.platforms.join(', ')}

## OUTPUT REQUIREMENTS

Generate the following in JSON format:

{
  "topic": "Short topic title (5-10 words)",
  "hook": "First line/first 3 seconds that stops the scroll. Must create curiosity or call out the ICP directly. Max 15 words.",
  "script_body": "Main content body. ${getBodyLengthGuidance(item.format)}",
  "cta": "Clear call to action. ${getCtaGuidance(item.funnel_stage)}",
  "caption": "Platform caption with line breaks. Include 3-5 hashtags at end."
}

## RULES
1. Write in first person (I/we) or second person (you)
2. Use short sentences and paragraphs
3. Start with the most compelling point
4. Every piece must have a clear CTA
5. Write for humans, not algorithms
6. Be specific, not generic

Generate the content now:`;
}

function getFunnelGuidance(stage: string): string {
  const guidance: Record<string, string> = {
    awareness: '- Goal: Stop the scroll, name the pain, build recognition. Don\'t sell — connect.',
    consideration: '- Goal: Build trust, show authority, teach something valuable. Position as the guide.',
    conversion: '- Goal: Drive action, overcome objections, create urgency. Make the next step clear.',
  };
  return guidance[stage] || '';
}

function getStoryBrandGuidance(stage: string): string {
  const guidance: Record<string, string> = {
    character: '- Name the hero (the ICP) and their desire. Make them feel seen.',
    external_problem: '- Name the visible struggle. What\'s not working?',
    internal_problem: '- Name how it FEELS. Frustration, doubt, exhaustion.',
    philosophical_problem: '- Name why it\'s WRONG. The injustice that shouldn\'t exist.',
    guide: '- Position yourself as the guide with empathy + authority.',
    plan: '- Show the clear path. Simple steps to transformation.',
    call_to_action: '- Tell them exactly what to do next.',
    failure: '- Show what happens if they don\'t act. Stakes and consequences.',
    success: '- Paint the picture of life after transformation.',
  };
  return guidance[stage] || '';
}

function getFormatGuidance(format: string): string {
  const guidance: Record<string, string> = {
    'short_video_30_60': '30-60 second video. Hook in first 3 seconds. One core idea. Strong close.',
    'short_video_60_90': '60-90 second video. Hook, story/point, CTA. Can go deeper than 30s format.',
    'short_video_60_120': '60-120 second video. More room for proof, objection handling, urgency.',
    'carousel_5_7': '5-7 slide carousel. Slide 1 = hook. Each slide = one point. Last slide = CTA.',
    'static_infographic': 'Single image with key stat, quote, or framework. Visual-first.',
  };
  return `- ${guidance[format] || 'Standard social media content.'}`;
}

function getBodyLengthGuidance(format: string): string {
  if (format.includes('30_60')) return 'Keep to 50-80 words.';
  if (format.includes('60_90')) return 'Keep to 80-120 words.';
  if (format.includes('60_120')) return 'Keep to 100-150 words.';
  if (format.includes('carousel')) return 'Write 5-7 short points, one per slide.';
  return 'Keep concise and punchy.';
}

function getCtaGuidance(funnelStage: string): string {
  const guidance: Record<string, string> = {
    awareness: 'Soft CTA: Follow, save, comment, share.',
    consideration: 'Medium CTA: Download, read more, watch full video.',
    conversion: 'Direct CTA: Apply, book call, DM \'READY\'.',
  };
  return guidance[funnelStage] || '';
}

function parseContentResponse(text: string): {
  topic: string;
  hook: string;
  script_body: string;
  cta: string;
  caption: string;
} {
  // Try to extract JSON from response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                    text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return {
        topic: json.topic || 'Generated content',
        hook: json.hook || '',
        script_body: json.script_body || '',
        cta: json.cta || '',
        caption: json.caption || '',
      };
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  }

  // Fallback: return raw text
  return {
    topic: 'Generated content',
    hook: '',
    script_body: text,
    cta: '',
    caption: '',
  };
}
