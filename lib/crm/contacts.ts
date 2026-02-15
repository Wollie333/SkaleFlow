import { createClient } from '@/lib/supabase/server';
import { logContactCreated } from './activity';
import type { Json } from '@/types/database';

interface GetContactsParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  lifecycleStage?: string;
  companyId?: string;
  tagId?: string;
  assignedTo?: string;
}

export async function getContacts(params: GetContactsParams) {
  const supabase = await createClient();
  const { organizationId, page = 1, limit = 25, search, lifecycleStage, companyId, assignedTo } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('crm_contacts')
    .select('*, crm_companies(id, name), crm_contact_tags(tag_id, crm_tags(id, name, color))', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (lifecycleStage) query = query.eq('lifecycle_stage', lifecycleStage);
  if (companyId) query = query.eq('company_id', companyId);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);

  const { data, error, count } = await query;
  if (error) throw error;

  // If tagId filter, we need to post-filter
  let filtered = data || [];
  if (params.tagId) {
    filtered = filtered.filter((c: Record<string, unknown>) => {
      const tags = c.crm_contact_tags as Array<{ tag_id: string }>;
      return tags?.some(t => t.tag_id === params.tagId);
    });
  }

  return { contacts: filtered, total: params.tagId ? filtered.length : (count || 0) };
}

export async function getContact(contactId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*, crm_companies(id, name, industry, website), crm_contact_tags(tag_id, crm_tags(id, name, color))')
    .eq('id', contactId)
    .single();
  if (error) throw error;
  return data;
}

interface CreateContactParams {
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  lifecycleStage?: string;
  source?: string;
  assignedTo?: string;
  customFields?: Record<string, unknown>;
  performedBy: string;
}

export async function createContact(params: CreateContactParams) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({
      organization_id: params.organizationId,
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email || null,
      phone: params.phone || null,
      job_title: params.jobTitle || null,
      company_id: params.companyId || null,
      lifecycle_stage: params.lifecycleStage || 'lead',
      source: params.source || 'manual',
      assigned_to: params.assignedTo || null,
      custom_fields: (params.customFields || {}) as unknown as Json,
    })
    .select()
    .single();
  if (error) throw error;

  await logContactCreated(
    params.organizationId,
    data.id,
    `${params.firstName} ${params.lastName}`,
    params.performedBy
  );

  return data;
}

export async function updateContact(contactId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  // Sanitise — don't allow overriding id/org
  const { id, organization_id, ...safe } = updates;
  if (safe.custom_fields) {
    safe.custom_fields = safe.custom_fields as unknown as Json;
  }
  const { data, error } = await supabase
    .from('crm_contacts')
    .update(safe)
    .eq('id', contactId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContact(contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('crm_contacts').delete().eq('id', contactId);
  if (error) throw error;
}

export async function searchContacts(organizationId: string, query: string, limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('id, first_name, last_name, email, company_id, crm_companies(id, name)')
    .eq('organization_id', organizationId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function updateLifetimeValue(contactId: string, addCents: number) {
  const supabase = await createClient();
  // Get current value first
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('lifetime_value_cents')
    .eq('id', contactId)
    .single();
  if (!contact) return;

  const newValue = (contact.lifetime_value_cents || 0) + addCents;
  await supabase
    .from('crm_contacts')
    .update({ lifetime_value_cents: newValue })
    .eq('id', contactId);
}
