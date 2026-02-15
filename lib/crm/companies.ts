import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

interface GetCompaniesParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
}

export async function getCompanies(params: GetCompaniesParams) {
  const supabase = await createClient();
  const { organizationId, page = 1, limit = 25, search, industry } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('crm_companies')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (industry) query = query.eq('industry', industry);

  const { data, error, count } = await query;
  if (error) throw error;
  return { companies: data || [], total: count || 0 };
}

export async function getCompany(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_companies')
    .select('*')
    .eq('id', companyId)
    .single();
  if (error) throw error;
  return data;
}

interface CreateCompanyParams {
  organizationId: string;
  name: string;
  industry?: string;
  website?: string;
  size?: string;
  annualRevenueCents?: number;
  billingAddress?: Record<string, unknown>;
  phone?: string;
  email?: string;
  notes?: string;
}

export async function createCompany(params: CreateCompanyParams) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_companies')
    .insert({
      organization_id: params.organizationId,
      name: params.name,
      industry: params.industry || null,
      website: params.website || null,
      size: params.size || null,
      annual_revenue_cents: params.annualRevenueCents || null,
      billing_address: (params.billingAddress || {}) as unknown as Json,
      phone: params.phone || null,
      email: params.email || null,
      notes: params.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(companyId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { id, organization_id, ...safe } = updates;
  if (safe.billing_address) {
    safe.billing_address = safe.billing_address as unknown as Json;
  }
  if (safe.custom_fields) {
    safe.custom_fields = safe.custom_fields as unknown as Json;
  }
  const { data, error } = await supabase
    .from('crm_companies')
    .update(safe)
    .eq('id', companyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(companyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('crm_companies').delete().eq('id', companyId);
  if (error) throw error;
}
