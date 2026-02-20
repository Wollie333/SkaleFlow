import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TemplatesListClient } from './templates-list-client';

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  // Check super admin
  const sc = createServiceClient();
  const { data: userData } = await sc.from('users').select('role').eq('id', user.id).single();
  const isSuperAdmin = userData?.role === 'super_admin';

  const { data: templates } = await supabase
    .from('call_templates')
    .select('*')
    .or(`is_system.eq.true,organization_id.eq.${member?.organization_id || '00000000-0000-0000-0000-000000000000'}`)
    .eq('is_active', true)
    .order('is_system', { ascending: false })
    .order('name');

  const isAdmin = member?.role === 'owner' || member?.role === 'admin';

  // Deduplicate by name — prefer org-specific over system templates
  // Super admin sees all templates (no dedup) so they can manage both versions
  const safeList = (templates || []).map(t => ({
    ...t,
    phases: Array.isArray(t.phases) ? t.phases : [],
    objection_bank: Array.isArray(t.objection_bank) ? t.objection_bank : [],
  }));

  let finalTemplates = safeList;
  if (!isSuperAdmin) {
    const deduped = new Map<string, (typeof safeList)[number]>();
    for (const t of safeList) {
      const existing = deduped.get(t.name);
      if (!existing || (!t.is_system && existing.is_system)) {
        deduped.set(t.name, t);
      }
    }
    finalTemplates = Array.from(deduped.values());
  }

  return (
    <TemplatesListClient
      templates={finalTemplates}
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
