import crypto from 'crypto';

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY environment variable is not set');
  return key;
}
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface PaystackCustomer {
  id: number;
  email: string;
  customer_code: string;
  first_name?: string;
  last_name?: string;
}

export interface PaystackSubscription {
  id: number;
  subscription_code: string;
  status: string;
  customer: PaystackCustomer;
  plan: {
    id: number;
    plan_code: string;
    name: string;
    amount: number;
    interval: string;
  };
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
  };
  next_payment_date: string;
  created_at: string;
}

export interface PaystackTransactionInit {
  authorization_url: string;
  access_code: string;
  reference: string;
}

async function paystackRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || 'Paystack API error');
  }

  return data.data;
}

/**
 * Initialize a transaction for subscription
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo (ZAR cents)
  plan?: string; // plan code for recurring
  callback_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackTransactionInit> {
  return paystackRequest<PaystackTransactionInit>('/transaction/initialize', 'POST', params);
}

/**
 * Verify a transaction
 */
export async function verifyTransaction(reference: string): Promise<{
  status: string;
  reference: string;
  amount: number;
  customer: PaystackCustomer;
  metadata?: Record<string, unknown>;
  authorization?: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
  };
  plan?: {
    plan_code: string;
    name: string;
  };
}> {
  return paystackRequest(`/transaction/verify/${reference}`);
}

/**
 * Create a subscription for a customer
 */
export async function createSubscription(params: {
  customer: string; // customer code or email
  plan: string; // plan code
  authorization?: string; // authorization code for auto-charge
  start_date?: string;
}): Promise<PaystackSubscription> {
  return paystackRequest<PaystackSubscription>('/subscription', 'POST', params);
}

/**
 * Get subscription details
 */
export async function getSubscription(idOrCode: string): Promise<PaystackSubscription> {
  return paystackRequest<PaystackSubscription>(`/subscription/${idOrCode}`);
}

/**
 * Disable a subscription
 */
export async function disableSubscription(params: {
  code: string;
  token: string;
}): Promise<{ message: string }> {
  return paystackRequest('/subscription/disable', 'POST', params);
}

/**
 * Enable a subscription
 */
export async function enableSubscription(params: {
  code: string;
  token: string;
}): Promise<{ message: string }> {
  return paystackRequest('/subscription/enable', 'POST', params);
}

/**
 * List all plans
 */
export async function listPlans(): Promise<Array<{
  id: number;
  name: string;
  plan_code: string;
  amount: number;
  interval: string;
  currency: string;
}>> {
  return paystackRequest('/plan');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha512', getSecretKey())
    .update(body)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Generate a unique transaction reference
 */
export function generateReference(): string {
  return `skf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
