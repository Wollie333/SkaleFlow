import { createServiceClient } from '@/lib/supabase/server';
import type { InvoiceType, Json } from '@/types/database';

const VAT_RATE = 0.15; // 15% South African VAT

interface LineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

/**
 * Generate next invoice number: SKF-YYYYMM-XXXXX
 */
async function generateInvoiceNumber(): Promise<string> {
  const supabase = createServiceClient();
  const now = new Date();
  const prefix = `SKF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Count existing invoices this month for sequential numbering
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}-%`);

  const seq = String((count || 0) + 1).padStart(5, '0');
  return `${prefix}-${seq}`;
}

/**
 * Create an invoice record.
 * Automatically calculates subtotal, VAT (15%), and total from line items.
 */
export async function createInvoice(params: {
  organizationId: string;
  invoiceType: InvoiceType;
  lineItems: LineItem[];
  paystackReference?: string;
  billingName?: string;
  billingEmail?: string;
  creditsGranted?: number;
}): Promise<string | null> {
  const supabase = createServiceClient();

  const invoiceNumber = await generateInvoiceNumber();

  const subtotalCents = params.lineItems.reduce((sum, item) => sum + item.total_cents, 0);
  // Total is the final price (inclusive of VAT). Subtotal is total / 1.15
  const subtotalExVat = Math.round(subtotalCents / (1 + VAT_RATE));
  const vatCents = subtotalCents - subtotalExVat;

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: params.organizationId,
      invoice_number: invoiceNumber,
      invoice_type: params.invoiceType,
      status: 'paid',
      subtotal_cents: subtotalExVat,
      vat_cents: vatCents,
      total_cents: subtotalCents,
      line_items: params.lineItems as unknown as Json,
      paystack_reference: params.paystackReference || null,
      billing_name: params.billingName || null,
      billing_email: params.billingEmail || null,
      credits_granted: params.creditsGranted || 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create invoice:', error);
    return null;
  }

  return data.id;
}

/**
 * Format cents as ZAR currency string (e.g. "R249.00")
 */
export function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
