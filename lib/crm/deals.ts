import { createClient } from '@/lib/supabase/server';
import { logDealCreated, logDealWon, logDealLost } from './activity';
import type { Json } from '@/types/database';

interface GetDealsParams {
  organizationId: string;
  page?: number;
  limit?: number;
  status?: string;
  pipelineId?: string;
  contactId?: string;
}

export async function getDeals(params: GetDealsParams) {
  const supabase = await createClient();
  const { organizationId, page = 1, limit = 25, status, pipelineId, contactId } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('crm_deals')
    .select('*, crm_contacts(id, first_name, last_name, email), crm_companies(id, name)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (pipelineId) query = query.eq('pipeline_id', pipelineId);
  if (contactId) query = query.eq('contact_id', contactId);

  const { data, error, count } = await query;
  if (error) throw error;
  return { deals: data || [], total: count || 0 };
}

export async function getDeal(dealId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_deals')
    .select('*, crm_contacts(id, first_name, last_name, email, phone), crm_companies(id, name), pipelines(id, name), pipeline_stages(id, name)')
    .eq('id', dealId)
    .single();
  if (error) throw error;
  return data;
}

interface CreateDealParams {
  organizationId: string;
  title: string;
  contactId?: string;
  companyId?: string;
  pipelineId?: string;
  stageId?: string;
  valueCents?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  products?: unknown[];
  performedBy: string;
}

export async function createDeal(params: CreateDealParams) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_deals')
    .insert({
      organization_id: params.organizationId,
      title: params.title,
      contact_id: params.contactId || null,
      company_id: params.companyId || null,
      pipeline_id: params.pipelineId || null,
      stage_id: params.stageId || null,
      value_cents: params.valueCents || 0,
      probability: params.probability || 0,
      expected_close_date: params.expectedCloseDate || null,
      assigned_to: params.assignedTo || null,
      products: (params.products || []) as unknown as Json,
    })
    .select()
    .single();
  if (error) throw error;

  await logDealCreated(params.organizationId, data.id, params.title, params.contactId || null, params.performedBy);

  return data;
}

export async function updateDeal(dealId: string, updates: Record<string, unknown>, organizationId: string, performedBy: string) {
  const supabase = await createClient();

  // Check for status transitions
  if (updates.status === 'won' || updates.status === 'lost') {
    const { data: existing } = await supabase
      .from('crm_deals')
      .select('title, contact_id, status')
      .eq('id', dealId)
      .single();

    if (existing && existing.status === 'open') {
      if (updates.status === 'won') {
        await logDealWon(organizationId, dealId, existing.title, existing.contact_id, performedBy);
      } else {
        await logDealLost(organizationId, dealId, existing.title, existing.contact_id, performedBy);
      }
    }
  }

  const { id, organization_id, ...safe } = updates;
  if (safe.products) {
    safe.products = safe.products as unknown as Json;
  }
  const { data, error } = await supabase
    .from('crm_deals')
    .update(safe)
    .eq('id', dealId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDeal(dealId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('crm_deals').delete().eq('id', dealId);
  if (error) throw error;
}

export async function getDealsByPipeline(organizationId: string, pipelineId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_deals')
    .select('*, crm_contacts(id, first_name, last_name)')
    .eq('organization_id', organizationId)
    .eq('pipeline_id', pipelineId)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
