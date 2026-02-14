import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getProviderAdapter } from '@/lib/ai/providers/registry';

export const maxDuration = 60;

/**
 * POST — AI-powered standardisation of existing templates.
 * Reads existing template data and extracts the 5 atomic sections:
 *   hook_rules, body_rules, cta_rules, tone_voice, formatting_rules
 *
 * Body: { templateId: string } — standardise one template
 *   OR: { batch: true } — standardise all non-standardised templates
 *
 * Uses Gemini 2.0 Flash (free model, no credits consumed).
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
    const { templateId, batch } = body;

    const serviceSupabase = createServiceClient();

    if (templateId) {
      // Single template standardisation
      const { data: template } = await serviceSupabase
        .from('content_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      const sections = await extractSections(template);
      if (!sections) {
        return NextResponse.json({ error: 'AI failed to extract sections' }, { status: 502 });
      }

      const { error: updateError } = await serviceSupabase
        .from('content_templates')
        .update({
          hook_rules: sections.hook_rules,
          body_rules: sections.body_rules,
          cta_rules: sections.cta_rules,
          tone_voice: sections.tone_voice,
          formatting_rules: sections.formatting_rules,
          is_standardised: true,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', templateId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
      }

      return NextResponse.json({ success: true, templateId, sections });
    }

    if (batch) {
      // Batch standardisation — process non-standardised templates
      const { data: templates } = await serviceSupabase
        .from('content_templates')
        .select('*')
        .eq('is_standardised', false)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!templates || templates.length === 0) {
        return NextResponse.json({ success: true, processed: 0, message: 'All templates already standardised' });
      }

      // Process up to 10 at a time to avoid timeout
      const limit = Math.min(templates.length, 10);
      const results: Array<{ id: string; name: string; success: boolean }> = [];

      for (let i = 0; i < limit; i++) {
        const template = templates[i];
        try {
          const sections = await extractSections(template);
          if (sections) {
            await serviceSupabase
              .from('content_templates')
              .update({
                hook_rules: sections.hook_rules,
                body_rules: sections.body_rules,
                cta_rules: sections.cta_rules,
                tone_voice: sections.tone_voice,
                formatting_rules: sections.formatting_rules,
                is_standardised: true,
                updated_at: new Date().toISOString(),
                updated_by: user.id,
              })
              .eq('id', template.id);

            results.push({ id: template.id, name: template.name, success: true });
          } else {
            results.push({ id: template.id, name: template.name, success: false });
          }
        } catch {
          results.push({ id: template.id, name: template.name, success: false });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const remaining = templates.length - limit;

      return NextResponse.json({
        success: true,
        processed: successCount,
        failed: limit - successCount,
        remaining,
        results,
      });
    }

    return NextResponse.json({ error: 'Provide templateId or batch: true' }, { status: 400 });
  } catch (error) {
    console.error('Error standardising template:', error);
    return NextResponse.json({ error: 'Failed to standardise template' }, { status: 500 });
  }
}

// ── AI extraction helper ──────────────────────────────────────────────

interface ExtractedSections {
  hook_rules: string;
  body_rules: string;
  cta_rules: string;
  tone_voice: string;
  formatting_rules: string;
}

interface TemplateInput {
  name: string;
  category: string;
  content_type: string;
  structure: string | null;
  psychology: string | null;
  description: string | null;
  when_to_use: string[] | null;
  when_not_to_use: string[] | null;
  prompt_instructions: string;
  example_content: string | null;
}

async function extractSections(template: TemplateInput): Promise<ExtractedSections | null> {
  const context = [
    `Template: ${template.name}`,
    `Category: ${template.category}`,
    `Content Type: ${template.content_type}`,
    template.description ? `Description: ${template.description}` : '',
    template.structure ? `Structure: ${template.structure}` : '',
    template.psychology ? `Psychology: ${template.psychology}` : '',
    template.when_to_use ? `When to Use: ${template.when_to_use.join('; ')}` : '',
    template.when_not_to_use ? `When Not to Use: ${template.when_not_to_use.join('; ')}` : '',
    `Prompt Instructions:\n${template.prompt_instructions}`,
    template.example_content ? `Example:\n${template.example_content.substring(0, 1500)}` : '',
  ].filter(Boolean).join('\n\n');

  const systemPrompt = `You are a content template analyst for SkaleFlow. Your job is to read an existing content template and extract 5 standardised sections from its existing data. Do NOT invent new rules — extract and organise what already exists in the template.

For each section, write clear, actionable rules that an AI content generator would follow. Be specific and practical. If the template doesn't explicitly cover a section, infer sensible rules from the template's structure and examples.

THE 5 SECTIONS:

1. HOOK RULES — How to open the content. What should the first 1-2 lines/sentences do? What technique does this template use to grab attention? Be specific about length, person (1st/2nd/3rd), tone, and any patterns.

2. BODY RULES — Rules for the main content body. What structure should it follow? How many points/sections? What kind of evidence or examples? What depth? How should ideas flow?

3. CTA RULES — How to close. What action should the reader take? How direct should the ask be? Should it be a question, command, or invitation? What makes a good closing for this specific template?

4. TONE & VOICE — Writing personality and style. What adjectives describe the voice? (e.g., conversational, authoritative, provocative). Any specific do's and don'ts for word choice, sentence length, formality level.

5. FORMATTING RULES — Structural/visual rules. Target word count or range. Line break frequency. Use of bullet points, numbering, bold, headers. Platform-specific notes. Mobile readability considerations.

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "hook_rules": "string — 2-5 sentences of clear rules",
  "body_rules": "string — 3-8 sentences of clear rules",
  "cta_rules": "string — 2-4 sentences of clear rules",
  "tone_voice": "string — 2-5 sentences describing the voice",
  "formatting_rules": "string — 3-5 sentences of formatting rules"
}`;

  try {
    const adapter = getProviderAdapter('google');
    const response = await adapter.complete({
      messages: [{ role: 'user', content: context }],
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.3,
    });

    let text = response.text.trim();
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    if (parsed.hook_rules && parsed.body_rules && parsed.cta_rules && parsed.tone_voice && parsed.formatting_rules) {
      return parsed as ExtractedSections;
    }

    console.error('[STANDARDISE] AI response missing required fields:', Object.keys(parsed));
    return null;
  } catch (err) {
    console.error('[STANDARDISE] AI extraction failed:', err);
    return null;
  }
}
