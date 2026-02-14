import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProviderAdapter } from '@/lib/ai/providers/registry';

export const maxDuration = 30;

/**
 * POST — AI-powered template classification.
 * Analyses template content and suggests: category, content_type, format_category,
 * tier, funnel_stages, storybrand_stages.
 * Uses Gemini 2.0 Flash (free) — no credit cost for super admins.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, structure, psychology, prompt_instructions, rawMarkdown } = body;

    if (!name && !rawMarkdown) {
      return NextResponse.json({ error: 'Provide at least a name or rawMarkdown' }, { status: 400 });
    }

    // Build context for classification
    const templateContext = [
      name ? `Template Name: ${name}` : '',
      description ? `Description: ${description}` : '',
      structure ? `Structure: ${structure}` : '',
      psychology ? `Psychology: ${psychology}` : '',
      prompt_instructions ? `Prompt Instructions: ${prompt_instructions.substring(0, 2000)}` : '',
      rawMarkdown && !prompt_instructions ? `Full Template Content:\n${rawMarkdown.substring(0, 4000)}` : '',
    ].filter(Boolean).join('\n\n');

    const systemPrompt = `You are a content template classifier for SkaleFlow, a content marketing platform.
Analyse the template and return a JSON classification. Be precise — pick the BEST match, not every possible match.

CATEGORY OPTIONS (pick exactly one):
- video_script: Templates for video scripts (short-form, long-form, reels, TikToks, YouTube)
- hook: Templates specifically for opening hooks/attention grabbers only
- cta: Templates specifically for calls-to-action only
- social_framework: Templates for complete social media posts (LinkedIn, Twitter, Facebook, Instagram posts)
- seo_content: Templates for SEO articles, blog posts, web content optimised for search
- email_outreach: Templates for email campaigns, cold outreach, newsletters
- web_copy: Templates for landing pages, sales pages, website copy

CONTENT TYPE (pick exactly one):
- post: A complete social media post or article
- script: A video/audio script with scene directions or speaking parts
- hook: Only the opening hook portion
- cta: Only the call-to-action portion

FORMAT CATEGORY (pick exactly one):
- short: Under 150 words, quick-hit content
- medium: 150-500 words, standard posts
- long: 500+ words, deep-dive content
- carousel: Multi-slide/multi-card format
- static: Single image with text overlay / quote card

TIER (pick exactly one):
- core_rotation: Simple, frequently-usable, everyday templates
- high_impact: Specialised templates that drive high engagement when used correctly
- strategic: Complex, premium frameworks requiring significant thought/customisation

FUNNEL STAGES (pick one or more):
- awareness: Top of funnel — brand discovery, thought leadership, education
- consideration: Middle of funnel — comparison, social proof, deeper value
- conversion: Bottom of funnel — direct offers, urgency, sales

STORYBRAND STAGES (pick 1-4 most relevant, mark the best one as primary):
- character: Identifying who the customer/hero is
- external_problem: The visible, tangible problem they face
- internal_problem: The emotional frustration behind the external problem
- philosophical_problem: Why this matters on a deeper/moral level
- guide: Positioning the brand as the trusted guide/expert
- plan: Laying out a clear path/steps to success
- call_to_action: Direct prompt to take action
- failure: What happens if they don't act (stakes/consequences)
- success: The transformation / happy ending after taking action

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "category": "social_framework",
  "content_type": "post",
  "format_category": "medium",
  "tier": "high_impact",
  "funnel_stages": ["awareness", "consideration"],
  "storybrand_stages": [
    { "stage": "guide", "is_primary": true },
    { "stage": "external_problem", "is_primary": false }
  ],
  "reasoning": "Brief 1-2 sentence explanation of classification choices"
}`;

    // Use Gemini 2.0 Flash — free model, no credits needed
    const adapter = getProviderAdapter('google');
    const response = await adapter.complete({
      messages: [
        { role: 'user', content: templateContext },
      ],
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.2,
    });

    // Parse the AI response as JSON
    let classification;
    try {
      // Strip markdown fences if present
      let text = response.text.trim();
      text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      classification = JSON.parse(text);
    } catch {
      console.error('Failed to parse AI classification response:', response.text);
      return NextResponse.json({
        error: 'AI returned invalid classification',
        raw: response.text,
      }, { status: 502 });
    }

    // Validate and sanitize
    const validCategories = ['video_script', 'hook', 'cta', 'social_framework', 'seo_content', 'email_outreach', 'web_copy'];
    const validContentTypes = ['post', 'script', 'hook', 'cta'];
    const validFormats = ['short', 'medium', 'long', 'carousel', 'static'];
    const validTiers = ['core_rotation', 'high_impact', 'strategic'];
    const validFunnel = ['awareness', 'consideration', 'conversion'];
    const validStorybrand = ['character', 'external_problem', 'internal_problem', 'philosophical_problem', 'guide', 'plan', 'call_to_action', 'failure', 'success'];

    const sanitized = {
      category: validCategories.includes(classification.category) ? classification.category : 'social_framework',
      content_type: validContentTypes.includes(classification.content_type) ? classification.content_type : 'post',
      format_category: validFormats.includes(classification.format_category) ? classification.format_category : 'medium',
      tier: validTiers.includes(classification.tier) ? classification.tier : 'core_rotation',
      funnel_stages: Array.isArray(classification.funnel_stages)
        ? classification.funnel_stages.filter((s: string) => validFunnel.includes(s))
        : ['awareness'],
      storybrand_stages: Array.isArray(classification.storybrand_stages)
        ? classification.storybrand_stages
            .filter((s: { stage: string }) => validStorybrand.includes(s.stage))
            .map((s: { stage: string; is_primary?: boolean }) => ({
              stage: s.stage,
              is_primary: !!s.is_primary,
            }))
        : [],
      reasoning: classification.reasoning || '',
    };

    return NextResponse.json({ success: true, classification: sanitized });
  } catch (error) {
    console.error('Error classifying template:', error);
    return NextResponse.json({ error: 'Failed to classify template' }, { status: 500 });
  }
}
