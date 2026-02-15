import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Public endpoint — no auth required
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // Find org by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('slug', slug)
    .single();

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  // Get published press releases
  const { data: pressReleases } = await supabase
    .from('authority_press_releases')
    .select('id, headline, subtitle, body_content, published_at, contact_info')
    .eq('organization_id', org.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  // Get published placements (cards at Published/Amplified stage)
  const { data: placements } = await supabase
    .from('authority_pipeline_cards')
    .select(`
      id, opportunity_name, target_outlet, category, reach_tier,
      published_at, live_url, confirmed_format,
      authority_commercial(engagement_type)
    `)
    .eq('organization_id', org.id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(20);

  // Get press kit
  const { data: pressKit } = await supabase
    .from('authority_press_kit')
    .select('brand_overview, boilerplate, founder_bio_short, founder_bio_long, speaking_topics, logo_usage_notes, hero_tagline')
    .eq('organization_id', org.id)
    .maybeSingle();

  // Get active story angles
  const { data: storyAngles } = await supabase
    .from('authority_story_angles')
    .select('id, title, description, category, display_order')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(6);

  // Get brand data for styling
  const { data: brandOutputs } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', org.id)
    .in('output_key', [
      'brand_color_palette', 'brand_typography', 'brand_logo_url',
      'brand_positioning_statement', 'brand_story', 'brand_tagline',
    ]);

  const brandMap: Record<string, unknown> = {};
  for (const b of brandOutputs || []) {
    brandMap[b.output_key] = b.output_value;
  }

  // Unique outlets for "As Seen In" bar
  const outlets = Array.from(new Set((placements || []).map(p => p.target_outlet).filter(Boolean)));

  return NextResponse.json({
    organization: org,
    press_releases: pressReleases || [],
    placements: (placements || []).map(p => ({
      ...p,
      engagement_type: (p.authority_commercial as { engagement_type: string } | null)?.engagement_type || 'earned',
    })),
    press_kit: pressKit ? {
      company_overview: pressKit.brand_overview,
      founder_bio: pressKit.founder_bio_long || pressKit.founder_bio_short,
      speaking_topics: pressKit.speaking_topics,
      brand_guidelines_url: pressKit.logo_usage_notes,
      hero_tagline: pressKit.hero_tagline,
    } : null,
    story_angles: (storyAngles || []).map(a => ({
      id: a.id,
      title: a.title,
      summary: a.description,
      category: a.category || 'general',
      newsworthiness: 5,
    })),
    brand: brandMap,
    outlets,
  });
}
