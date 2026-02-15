import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getActiveConnection } from '@/lib/canva/token-manager';
import { syncBrandToCanva } from '@/lib/canva/brand-sync';
import { parseBrandOutputs } from '@/lib/playbook/parse-brand-outputs';
import type { BrandOutput } from '@/lib/playbook/parse-brand-outputs';
import type { Json } from '@/types/database';

export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only org owners and admins can sync brand assets' }, { status: 403 });
  }

  const active = await getActiveConnection(membership.organization_id);
  if (!active) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }

  // Fetch brand outputs for this org
  const serviceClient = createServiceClient();
  const { data: brandOutputs } = await serviceClient
    .from('brand_outputs')
    .select('id, output_key, output_value, is_locked, phase_id')
    .eq('organization_id', membership.organization_id);

  if (!brandOutputs || brandOutputs.length === 0) {
    return NextResponse.json({ error: 'No brand outputs found. Complete Brand Engine phases first.' }, { status: 400 });
  }

  const outputs: BrandOutput[] = brandOutputs.map(o => ({
    id: o.id,
    output_key: o.output_key,
    output_value: o.output_value as Json,
    is_locked: o.is_locked,
    phase_id: o.phase_id,
  }));

  const parsed = parseBrandOutputs(outputs);

  try {
    const result = await syncBrandToCanva({
      accessToken: active.accessToken,
      brandLogoUrl: parsed.brand_logo_url,
      colorPalette: parsed.brand_color_palette,
    });

    return NextResponse.json({
      success: true,
      logoUploaded: result.logoUploaded,
      swatchesUploaded: result.swatchesUploaded,
      errors: result.errors,
    });
  } catch (error) {
    console.error('[canva-sync-brand] Failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync brand assets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
