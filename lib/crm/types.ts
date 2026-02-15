import type { Json, CrmLifecycleStage, CrmContactSource, CrmDealStatus, CrmInvoiceStatus, CrmActivityType, CrmBillingInterval } from '@/types/database';

export interface CrmCompany {
  id: string;
  organization_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  size: string | null;
  annual_revenue_cents: number | null;
  billing_address: Record<string, unknown>;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  custom_fields: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contacts_count?: number;
  deals_total_value?: number;
}

export interface CrmContact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: string | null;
  lifecycle_stage: CrmLifecycleStage;
  source: CrmContactSource;
  assigned_to: string | null;
  custom_fields: Record<string, unknown>;
  last_contacted_at: string | null;
  lifetime_value_cents: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  company?: CrmCompany | null;
  tags?: CrmTag[];
  assigned_user?: { full_name: string; email: string } | null;
}

export interface CrmTag {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CrmProduct {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price_cents: number;
  currency: string;
  recurring: boolean;
  billing_interval: CrmBillingInterval;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CrmDeal {
  id: string;
  organization_id: string;
  title: string;
  contact_id: string | null;
  company_id: string | null;
  pipeline_id: string | null;
  stage_id: string | null;
  value_cents: number;
  probability: number;
  expected_close_date: string | null;
  status: CrmDealStatus;
  lost_reason: string | null;
  assigned_to: string | null;
  products: DealLineItem[];
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: CrmContact | null;
  company?: CrmCompany | null;
  pipeline?: { id: string; name: string } | null;
  stage?: { id: string; name: string } | null;
}

export interface DealLineItem {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface CrmInvoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  contact_id: string | null;
  company_id: string | null;
  deal_id: string | null;
  status: CrmInvoiceStatus;
  subtotal_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  billing_from: BillingAddress;
  billing_to: BillingAddress;
  share_token: string | null;
  notes: string | null;
  footer_text: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: CrmContact | null;
  company?: CrmCompany | null;
  items?: CrmInvoiceItem[];
}

export interface BillingAddress {
  name?: string;
  company?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  email?: string;
  phone?: string;
  vat_number?: string;
}

export interface CrmInvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  sort_order: number;
  created_at: string;
}

export interface CrmActivity {
  id: string;
  organization_id: string;
  contact_id: string | null;
  company_id: string | null;
  deal_id: string | null;
  invoice_id: string | null;
  activity_type: CrmActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  performed_by: string | null;
  created_at: string;
  // Joined
  performer?: { full_name: string } | null;
}

export interface CrmDashboardStats {
  contacts_by_lifecycle: Record<CrmLifecycleStage, number>;
  total_contacts: number;
  total_companies: number;
  open_deals_count: number;
  open_deals_value: number;
  won_deals_this_month: number;
  won_deals_value_this_month: number;
  overdue_invoices_count: number;
  revenue_this_month: number;
  revenue_last_month: number;
  recent_activity: CrmActivity[];
}
