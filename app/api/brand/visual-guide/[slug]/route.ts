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

  // Fetch visual identity brand outputs
  const VISUAL_KEYS = [
    'brand_logo_primary',
    'brand_logo_url', // legacy fallback
    'brand_color_palette',
    'brand_typography',
    'brand_tagline',
    'positioning_statement',
    'design_system_colors',
    'design_system_typography',
    'design_system_components',
    'visual_mood',
    'imagery_direction',
    'brand_elements',
    'brand_archetype',
    'visual_inspirations',
    'brand_visual_assets_summary',
  ];

  const { data: outputs } = await supabase
    .from('brand_outputs')
    .select('output_key, output_value')
    .eq('organization_id', org.id)
    .in('output_key', VISUAL_KEYS);

  const brand: Record<string, unknown> = {};
  for (const o of outputs || []) {
    brand[o.output_key] = o.output_value;
  }

  // Fetch visual assets (logo variants, patterns, mood board)
  const { data: visualAssets } = await supabase
    .from('brand_visual_assets')
    .select('id, asset_type, file_url, file_name, sort_order')
    .eq('organization_id', org.id)
    .order('asset_type')
    .order('sort_order');

  return NextResponse.json({
    organization: org,
    brand,
    visualAssets: visualAssets || [],
  });
}
