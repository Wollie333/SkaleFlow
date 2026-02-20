import { createServiceClient } from '@/lib/supabase/server';
import { parseBrandOutputs } from '@/lib/playbook/parse-brand-outputs';
import { extractPlaybookTheme, type PlaybookTheme } from '@/lib/playbook/playbook-theme';

export async function getFormTheme(organizationId: string): Promise<PlaybookTheme | null> {
  const supabase = createServiceClient();

  const { data: outputs } = await supabase
    .from('brand_outputs')
    .select('id, output_key, output_value, is_locked, phase_id')
    .eq('organization_id', organizationId);

  if (!outputs || outputs.length === 0) return null;

  const parsed = parseBrandOutputs(outputs as Array<{
    id: string;
    output_key: string;
    output_value: unknown;
    is_locked: boolean;
    phase_id: string;
  }>);

  const theme = extractPlaybookTheme(
    parsed.colorPalette,
    parsed.typography,
    parsed.designSystemColors,
  );

  return theme;
}
