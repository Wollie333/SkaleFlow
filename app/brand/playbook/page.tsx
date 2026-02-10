import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlaybookClient } from './playbook-client';
import type { BrandOutput } from '@/lib/playbook/parse-brand-outputs';

interface PageProps {
  searchParams: { organizationId?: string };
}

export default async function PlaybookPage({ searchParams }: PageProps) {
  const organizationId = searchParams.organizationId;

  if (!organizationId) {
    redirect('/brand');
  }

  const supabase = await createClient();

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Verify org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();

  if (!membership) {
    redirect('/brand');
  }

  // Fetch organization details including share token
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, logo_url, playbook_share_token')
    .eq('id', organizationId)
    .single();

  if (!organization) {
    redirect('/brand');
  }

  // Fetch all locked brand outputs
  const { data: rawOutputs } = await supabase
    .from('brand_outputs')
    .select('id, output_key, output_value, is_locked, phase_id')
    .eq('organization_id', organizationId)
    .eq('is_locked', true);

  // Fetch all brand phases for ordering
  const { data: phases } = await supabase
    .from('brand_phases')
    .select('id, phase_number, phase_name, status')
    .eq('organization_id', organizationId)
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
        playbookShareToken: organization.playbook_share_token,
      }}
      outputs={outputs}
      phases={(phases || []).map(p => ({
        id: p.id,
        phase_number: p.phase_number,
        phase_name: p.phase_name,
      }))}
    />
  );
}
