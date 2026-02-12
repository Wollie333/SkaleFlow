import { redirect, notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { PlaybookClient } from './playbook-client';
import type { BrandOutput } from '@/lib/playbook/parse-brand-outputs';

interface PageProps {
  searchParams: Promise<{ organizationId?: string }>;
}

export default async function PlaybookPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const organizationId = params.organizationId;

  if (!organizationId) {
    redirect('/brand');
  }

  // Try to get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is a member of the org
  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    isMember = !!membership;
  }

  // Use service client for public access
  const serviceSupabase = createServiceClient();

  // Fetch organization details including share token
  const { data: organization } = await serviceSupabase
    .from('organizations')
    .select('id, name, logo_url, playbook_share_token')
    .eq('id', organizationId)
    .single();

  if (!organization) {
    notFound();
  }

  // Fetch all locked brand outputs (only locked outputs are public)
  const { data: rawOutputs } = await serviceSupabase
    .from('brand_outputs')
    .select('id, output_key, output_value, is_locked, phase_id')
    .eq('organization_id', organizationId)
    .eq('is_locked', true);

  // Fetch all brand phases for ordering
  const { data: phases } = await serviceSupabase
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
        playbookShareToken: isMember ? organization.playbook_share_token : undefined,
      }}
      outputs={outputs}
      phases={(phases || []).map(p => ({
        id: p.id,
        phase_number: p.phase_number,
        phase_name: p.phase_name,
      }))}
      isPublicView={!isMember}
    />
  );
}
