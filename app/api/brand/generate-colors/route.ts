import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveModel, requireCredits, calculateCreditCost, deductCredits, getProviderAdapterForUser } from '@/lib/ai/server';
import { getArchetypeProfile } from '@/lib/brand/archetype-profiles';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { organizationId, lockedColors, modelOverride } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Membership check
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch brand context
    const { data: outputs } = await supabase
      .from('brand_outputs')
      .select('output_key, output_value')
      .eq('organization_id', organizationId)
      .in('output_key', ['brand_archetype', 'visual_mood', 'imagery_direction', 'brand_characteristics', 'brand_values']);

    const outputMap: Record<string, unknown> = {};
    for (const o of outputs || []) {
      outputMap[o.output_key] = o.output_value;
    }

    const archetypeName = typeof outputMap.brand_archetype === 'string' ? outputMap.brand_archetype : null;
    const archetypeProfile = archetypeName ? getArchetypeProfile(archetypeName) : null;
    const visualMood = typeof outputMap.visual_mood === 'string' ? outputMap.visual_mood : '';
    const imageryDirection = typeof outputMap.imagery_direction === 'string' ? outputMap.imagery_direction : '';
    const characteristics = typeof outputMap.brand_characteristics === 'string' ? outputMap.brand_characteristics : '';

    // Build locked colors description
    const lockedDesc = lockedColors && Object.keys(lockedColors).length > 0
      ? `Keep these colors EXACTLY as-is (they are locked): ${Object.entries(lockedColors).map(([role, hex]) => `${role}: ${hex}`).join(', ')}. Generate harmonious colors for the remaining slots.`
      : 'Generate all 5 colors fresh.';

    const colorAssociations = archetypeProfile?.color_associations?.join(', ') || 'teal, gold, charcoal, cream, slate';

    const prompt = `Generate a harmonious 5-color brand palette. Return ONLY a JSON object, no other text.

Brand context:
- Archetype: ${archetypeName || 'Not set'}
- Archetype color associations: ${colorAssociations}
- Visual mood: ${visualMood || 'Not set'}
- Imagery direction: ${imageryDirection || 'Not set'}
- Brand characteristics: ${characteristics || 'Not set'}

${lockedDesc}

Return this exact JSON structure:
{
  "name": "Creative palette name",
  "primary": "#hex",
  "dark_base": "#hex",
  "accent": "#hex",
  "light": "#hex",
  "neutral": "#hex"
}

Rules:
- primary: The main brand color — vibrant, recognizable
- dark_base: Dark color for backgrounds and text — nearly black but with brand tint
- accent: Secondary color for highlights and CTAs — complementary or analogous to primary
- light: Very light background color — off-white with warmth
- neutral: Muted mid-tone for body text and borders
- All colors must have good contrast ratios when used together
- Ensure the palette feels cohesive and matches the brand archetype
- Return ONLY the JSON, no markdown fences, no explanation`;

    // Resolve model & check credits
    const feature: 'brand_chat' = 'brand_chat';
    const model = await resolveModel(organizationId, feature, modelOverride, user.id);

    const creditCheck = await requireCredits(organizationId, feature, model.id, 500, user.id);
    if (creditCheck) return creditCheck;

    // Call AI
    const adapter = await getProviderAdapterForUser(model.provider, user.id);
    const response = await adapter.complete({
      modelId: model.id,
      systemPrompt: 'You are a color theory expert. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 300,
      temperature: 0.8,
    });

    // Deduct credits
    const cost = calculateCreditCost(model, response.usage.inputTokens, response.usage.outputTokens);
    await deductCredits(organizationId, cost, feature, model.id, user.id);

    // Parse JSON from response
    let paletteJson: Record<string, string>;
    try {
      const text = response.content.trim();
      // Try to extract JSON if wrapped in fences
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      paletteJson = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON. Try again.' }, { status: 500 });
    }

    // Validate hex codes
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    const keys = ['primary', 'dark_base', 'accent', 'light', 'neutral'];
    for (const key of keys) {
      if (!paletteJson[key] || !hexRegex.test(paletteJson[key])) {
        paletteJson[key] = '#888888';
      }
    }

    // Apply locked colors back
    if (lockedColors) {
      for (const [role, hex] of Object.entries(lockedColors)) {
        if (keys.includes(role) && typeof hex === 'string') {
          paletteJson[role] = hex;
        }
      }
    }

    return NextResponse.json({
      palette: {
        name: paletteJson.name || `${archetypeName || 'Brand'} Palette`,
        ...paletteJson,
      },
    });
  } catch (error) {
    console.error('Generate colors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
