import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductCredits } from '@/lib/ai/server';

// Fixed credit cost for DALL-E 3 logo generation (~$0.08 per image)
const LOGO_CREDITS = 288;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, prompt, brandContext } = await request.json();

    if (!organizationId || !prompt) {
      return NextResponse.json({ error: 'organizationId and prompt are required' }, { status: 400 });
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

    // Credit check for logo generation (super_admins bypass)
    const balance = await checkCredits(organizationId, LOGO_CREDITS, user.id);
    if (!balance.hasCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          creditsRequired: LOGO_CREDITS,
          creditsAvailable: balance.totalRemaining,
        },
        { status: 402 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI logo generation is not configured. Please add OPENAI_API_KEY.' }, { status: 503 });
    }

    // Build enhanced prompt with brand context
    const brandInfo = brandContext
      ? `Brand context: ${typeof brandContext === 'string' ? brandContext : JSON.stringify(brandContext)}. `
      : '';

    const enhancedPrompt = `Professional brand logo design: ${brandInfo}${prompt}. Clean, modern, high-resolution logo on a white background. Minimal, scalable design suitable for business branding. No text overlays unless specifically requested. Vector-style clean edges.`;

    // Call OpenAI DALL-E 3
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      const openaiMessage = errorData?.error?.message || 'Failed to generate logo';
      return NextResponse.json({ error: openaiMessage }, { status: 500 });
    }

    const data = await response.json();
    const tempImageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;

    if (!tempImageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Download the generated image server-side (avoids CORS and expiring URL issues)
    let permanentUrl = tempImageUrl;
    try {
      const imageResponse = await fetch(tempImageUrl);
      if (imageResponse.ok) {
        const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
        const filePath = `${organizationId}/logo-generated-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('org-logos')
          .upload(filePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('org-logos')
            .getPublicUrl(filePath);
          permanentUrl = publicUrl;
        } else {
          console.error('Failed to upload generated logo to storage:', uploadError.message);
        }
      }
    } catch (downloadErr) {
      console.error('Failed to download generated image for storage:', downloadErr);
      // Fall back to temporary URL — client can still display it
    }

    // Track AI usage
    const { data: usageRow } = await supabase
      .from('ai_usage')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        feature: 'logo_generation',
        model: 'dall-e-3',
        input_tokens: 0,
        output_tokens: 0,
        credits_charged: LOGO_CREDITS,
        provider: 'openai',
        is_free_model: false,
      })
      .select('id')
      .single();

    // Deduct credits
    await deductCredits(
      organizationId,
      user.id,
      LOGO_CREDITS,
      usageRow?.id || null,
      'Logo generation — DALL-E 3'
    );

    return NextResponse.json({
      imageUrl: permanentUrl,
      revisedPrompt,
    });
  } catch (error) {
    console.error('Logo generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
