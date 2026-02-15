import { createClient } from '@/lib/supabase/server';

interface GetProductsParams {
  organizationId: string;
  activeOnly?: boolean;
}

export async function getProducts(params: GetProductsParams) {
  const supabase = await createClient();
  let query = supabase
    .from('crm_products')
    .select('*')
    .eq('organization_id', params.organizationId)
    .order('sort_order', { ascending: true });

  if (params.activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProduct(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_products')
    .select('*')
    .eq('id', productId)
    .single();
  if (error) throw error;
  return data;
}

interface CreateProductParams {
  organizationId: string;
  name: string;
  description?: string;
  sku?: string;
  priceCents: number;
  currency?: string;
  recurring?: boolean;
  billingInterval?: string;
  sortOrder?: number;
}

export async function createProduct(params: CreateProductParams) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_products')
    .insert({
      organization_id: params.organizationId,
      name: params.name,
      description: params.description || null,
      sku: params.sku || null,
      price_cents: params.priceCents,
      currency: params.currency || 'ZAR',
      recurring: params.recurring || false,
      billing_interval: params.billingInterval || 'once',
      sort_order: params.sortOrder || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(productId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { id, organization_id, ...safe } = updates;
  const { data, error } = await supabase
    .from('crm_products')
    .update(safe)
    .eq('id', productId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('crm_products').delete().eq('id', productId);
  if (error) throw error;
}
