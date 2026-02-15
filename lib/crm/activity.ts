import { createClient } from '@/lib/supabase/server';
import type { CrmActivityType } from '@/types/database';

interface LogActivityParams {
  organizationId: string;
  activityType: CrmActivityType;
  title: string;
  description?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  invoiceId?: string;
  metadata?: Record<string, unknown>;
  performedBy?: string;
}

export async function logActivity(params: LogActivityParams) {
  const supabase = await createClient();
  const { error } = await supabase.from('crm_activity').insert({
    organization_id: params.organizationId,
    activity_type: params.activityType,
    title: params.title,
    description: params.description || null,
    contact_id: params.contactId || null,
    company_id: params.companyId || null,
    deal_id: params.dealId || null,
    invoice_id: params.invoiceId || null,
    metadata: (params.metadata || {}) as unknown as import('@/types/database').Json,
    performed_by: params.performedBy || null,
  });
  if (error) console.error('Failed to log CRM activity:', error);
}

export async function logContactCreated(organizationId: string, contactId: string, contactName: string, performedBy: string) {
  return logActivity({
    organizationId,
    activityType: 'contact_created',
    title: `Contact created: ${contactName}`,
    contactId,
    performedBy,
  });
}

export async function logNote(organizationId: string, title: string, description: string, performedBy: string, contactId?: string, companyId?: string, dealId?: string) {
  return logActivity({
    organizationId,
    activityType: 'note',
    title,
    description,
    contactId,
    companyId,
    dealId,
    performedBy,
  });
}

export async function logDealCreated(organizationId: string, dealId: string, dealTitle: string, contactId: string | null, performedBy: string) {
  return logActivity({
    organizationId,
    activityType: 'deal_created',
    title: `Deal created: ${dealTitle}`,
    dealId,
    contactId: contactId || undefined,
    performedBy,
  });
}

export async function logDealWon(organizationId: string, dealId: string, dealTitle: string, contactId: string | null, performedBy: string) {
  return logActivity({
    organizationId,
    activityType: 'deal_won',
    title: `Deal won: ${dealTitle}`,
    dealId,
    contactId: contactId || undefined,
    performedBy,
  });
}

export async function logDealLost(organizationId: string, dealId: string, dealTitle: string, contactId: string | null, performedBy: string) {
  return logActivity({
    organizationId,
    activityType: 'deal_lost',
    title: `Deal lost: ${dealTitle}`,
    dealId,
    contactId: contactId || undefined,
    performedBy,
  });
}

export async function logInvoiceSent(organizationId: string, invoiceId: string, invoiceNumber: string, contactId: string | null, performedBy: string) {
  return logActivity({
    organizationId,
    activityType: 'invoice_sent',
    title: `Invoice sent: ${invoiceNumber}`,
    invoiceId,
    contactId: contactId || undefined,
    performedBy,
  });
}

export async function logInvoicePaid(organizationId: string, invoiceId: string, invoiceNumber: string, contactId: string | null, performedBy: string) {
  return logActivity({
    organizationId,
    activityType: 'invoice_paid',
    title: `Invoice paid: ${invoiceNumber}`,
    invoiceId,
    contactId: contactId || undefined,
    performedBy,
  });
}
