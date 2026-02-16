import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { PlaybookClient } from '@/app/brand/playbook/playbook-client';
import type { BrandOutput } from '@/lib/playbook/parse-brand-outputs';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicPlaybookPage({ params }: PageProps) {
  const { token } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    notFound();
  }

  // Use service client — no auth required for public view
  const supabase = createServiceClient();

  // Find organization by share token
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, logo_url, playbook_share_token')
    .eq('playbook_share_token', token)
    .single();

  if (!organization) {
    notFound();
  }

  // Fetch all locked brand outputs (only locked ones are public)
  const { data: rawOutputs } = await supabase
    .from('brand_outputs')
    .select('id, output_key, output_value, is_locked, phase_id')
    .eq('organization_id', organization.id)
    .eq('is_locked', true);

  // Fetch phases for ordering
  const { data: phases } = await supabase
    .from('brand_phases')
    .select('id, phase_number, phase_name, status')
    .eq('organization_id', organization.id)
    .order('sort_order');

  const outputs: BrandOutput[] = (rawOutputs || []).map(o => ({
    id: o.id,
    output_key: o.output_key,
    output_value: o.output_value,
    is_locked: o.is_locked,
    phase_id: o.phase_id,
  }));

  return (
    <PlaybookClient
      organization={{
        id: organization.id,
        name: organization.name,
        logoUrl: organization.logo_url,
      }}
      outputs={outputs}
      phases={(phases || []).map(p => ({
        id: p.id,
        phase_number: p.phase_number,
        phase_name: p.phase_name,
      }))}
      isPublicView
    />
  );
}
