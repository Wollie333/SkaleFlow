import { createClient } from '@/lib/supabase/server';
import { logInvoiceSent, logInvoicePaid } from './activity';
import { updateLifetimeValue } from './contacts';
import type { Json } from '@/types/database';
import crypto from 'crypto';

interface GetInvoicesParams {
  organizationId: string;
  page?: number;
  limit?: number;
  status?: string;
  contactId?: string;
}

export async function getInvoices(params: GetInvoicesParams) {
  const supabase = await createClient();
  const { organizationId, page = 1, limit = 25, status, contactId } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('crm_invoices')
    .select('*, crm_contacts(id, first_name, last_name, email), crm_companies(id, name)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (contactId) query = query.eq('contact_id', contactId);

  const { data, error, count } = await query;
  if (error) throw error;
  return { invoices: data || [], total: count || 0 };
}

export async function getInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_invoices')
    .select('*, crm_contacts(id, first_name, last_name, email, phone), crm_companies(id, name), crm_invoice_items(*)')
    .eq('id', invoiceId)
    .single();
  if (error) throw error;
  return data;
}

export async function getInvoiceByShareToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_invoices')
    .select('*, crm_contacts(id, first_name, last_name, email), crm_companies(id, name), crm_invoice_items(*)')
    .eq('share_token', token)
    .single();
  if (error) throw error;
  return data;
}

export async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const supabase = await createClient();
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { count } = await supabase
    .from('crm_invoices')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .like('invoice_number', `${prefix}-%`);

  const seq = String((count || 0) + 1).padStart(5, '0');
  return `${prefix}-${seq}`;
}

interface CreateInvoiceParams {
  organizationId: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  taxRate?: number;
  currency?: string;
  dueDate?: string;
  billingFrom?: Record<string, unknown>;
  billingTo?: Record<string, unknown>;
  notes?: string;
  footerText?: string;
}

export async function createInvoice(params: CreateInvoiceParams) {
  const supabase = await createClient();
  const invoiceNumber = await generateInvoiceNumber(params.organizationId);

  const { data, error } = await supabase
    .from('crm_invoices')
    .insert({
      organization_id: params.organizationId,
      invoice_number: invoiceNumber,
      contact_id: params.contactId || null,
      company_id: params.companyId || null,
      deal_id: params.dealId || null,
      tax_rate: params.taxRate ?? 15,
      currency: params.currency || 'ZAR',
      due_date: params.dueDate || null,
      billing_from: (params.billingFrom || {}) as unknown as Json,
      billing_to: (params.billingTo || {}) as unknown as Json,
      notes: params.notes || null,
      footer_text: params.footerText || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInvoice(invoiceId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { id, organization_id, ...safe } = updates;
  if (safe.billing_from) safe.billing_from = safe.billing_from as unknown as Json;
  if (safe.billing_to) safe.billing_to = safe.billing_to as unknown as Json;

  const { data, error } = await supabase
    .from('crm_invoices')
    .update(safe)
    .eq('id', invoiceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient();
  // Only allow deleting drafts
  const { data: invoice } = await supabase
    .from('crm_invoices')
    .select('status')
    .eq('id', invoiceId)
    .single();
  if (invoice?.status !== 'draft') {
    throw new Error('Only draft invoices can be deleted');
  }
  const { error } = await supabase.from('crm_invoices').delete().eq('id', invoiceId);
  if (error) throw error;
}

export async function markAsSent(invoiceId: string, organizationId: string, performedBy: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId)
    .select('invoice_number, contact_id')
    .single();
  if (error) throw error;

  await logInvoiceSent(organizationId, invoiceId, data.invoice_number, data.contact_id, performedBy);
  return data;
}

export async function markAsPaid(invoiceId: string, organizationId: string, performedBy: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select('invoice_number, contact_id, total_cents')
    .single();
  if (error) throw error;

  await logInvoicePaid(organizationId, invoiceId, data.invoice_number, data.contact_id, performedBy);

  // Update contact lifetime value
  if (data.contact_id) {
    await updateLifetimeValue(data.contact_id, data.total_cents);
  }

  return data;
}

export function generateShareToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function recalculateTotals(invoiceId: string) {
  const supabase = await createClient();

  // Get all line items
  const { data: items } = await supabase
    .from('crm_invoice_items')
    .select('total_cents')
    .eq('invoice_id', invoiceId);

  const subtotal = (items || []).reduce((sum, item) => sum + item.total_cents, 0);

  // Get tax rate
  const { data: invoice } = await supabase
    .from('crm_invoices')
    .select('tax_rate')
    .eq('id', invoiceId)
    .single();

  const taxRate = invoice?.tax_rate || 15;
  const taxCents = Math.round(subtotal * (taxRate / 100));
  const totalCents = subtotal + taxCents;

  const { error } = await supabase
    .from('crm_invoices')
    .update({ subtotal_cents: subtotal, tax_cents: taxCents, total_cents: totalCents })
    .eq('id', invoiceId);

  if (error) throw error;
  return { subtotal_cents: subtotal, tax_cents: taxCents, total_cents: totalCents };
}
