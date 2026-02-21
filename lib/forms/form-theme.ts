import { createServiceClient } from '@/lib/supabase/server';
import { parseBrandOutputs } from '@/lib/playbook/parse-brand-outputs';
import { extractPlaybookTheme, type PlaybookTheme } from '@/lib/playbook/playbook-theme';
import type { Json } from '@/types/database';

export async function getFormTheme(organizationId: string): Promise<PlaybookTheme | null> {
  const supabase = createServiceClient();

  const { data: outputs } = await supabase
    .from('brand_outputs')
    .select('id, output_key, output_value, is_locked, phase_id')
    .eq('organization_id', organizationId);

  if (!outputs || outputs.length === 0) return null;

  const parsed = parseBrandOutputs(outputs.map(o => ({
    ...o,
    output_value: o.output_value as Json,
  })));

  const theme = extractPlaybookTheme(
    parsed.brand_color_palette,
    parsed.brand_typography,
    parsed.design_system_colors,
  );

  return theme;
}
