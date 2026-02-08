import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { createInvoice } from '@/lib/billing/invoice-service';
import { addTopupCredits, initializeCreditBalance } from '@/lib/ai/credits';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createServiceClient();

    switch (event.event) {
      case 'subscription.create': {
        // New subscription created
        const subscription = event.data;
        await handleSubscriptionCreated(supabase, subscription);
        break;
      }

      case 'subscription.not_renew': {
        // Subscription will not renew
        const subscription = event.data;
        await handleSubscriptionCancelled(supabase, subscription);
        break;
      }

      case 'subscription.disable': {
        // Subscription disabled
        const subscription = event.data;
        await handleSubscriptionDisabled(supabase, subscription);
        break;
      }

      case 'charge.success': {
        // Payment successful — could be subscription renewal or topup
        const transaction = event.data;
        const metadata = transaction.metadata || {};

        if (metadata.type === 'topup') {
          await handleTopupPayment(supabase, transaction);
        } else if (transaction.plan) {
          await handlePaymentSuccess(supabase, transaction);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed
        const invoice = event.data;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        // Log unhandled events
        console.log('Unhandled Paystack event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: {
    subscription_code: string;
    customer: { email: string };
    plan: { plan_code: string; name: string; amount: number };
    next_payment_date: string;
  }
) {
  // Find user by email
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', subscription.customer.email)
    .single();

  if (!user) {
    console.error('User not found for subscription:', subscription.customer.email);
    return;
  }

  // Find organization
  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    console.error('No organization for user:', user.id);
    return;
  }

  // Find subscription tier
  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select('id, monthly_credits, name, price_monthly')
    .eq('paystack_plan_code', subscription.plan.plan_code)
    .single();

  if (!tier) {
    console.error('Tier not found for plan:', subscription.plan.plan_code);
    return;
  }

  // Create or update subscription
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      organization_id: membership.organization_id,
      tier_id: tier.id,
      status: 'active',
      paystack_subscription_code: subscription.subscription_code,
      current_period_end: subscription.next_payment_date,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'organization_id',
    });

  if (error) {
    console.error('Failed to create subscription:', error);
  }

  // Initialize credit balance for the org
  if (tier.monthly_credits > 0) {
    await initializeCreditBalance(membership.organization_id, tier.monthly_credits);
  }

  // Create subscription invoice
  await createInvoice({
    organizationId: membership.organization_id,
    invoiceType: 'subscription',
    lineItems: [{
      description: `${tier.name} Plan — Monthly Subscription`,
      quantity: 1,
      unit_price_cents: tier.price_monthly,
      total_cents: tier.price_monthly,
    }],
    billingEmail: subscription.customer.email,
    creditsGranted: tier.monthly_credits,
  });
}

async function handleSubscriptionCancelled(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: { subscription_code: string }
) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('paystack_subscription_code', subscription.subscription_code);

  if (error) {
    console.error('Failed to cancel subscription:', error);
  }
}

async function handleSubscriptionDisabled(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: { subscription_code: string }
) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('paystack_subscription_code', subscription.subscription_code);

  if (error) {
    console.error('Failed to disable subscription:', error);
  }
}

async function handlePaymentSuccess(
  supabase: ReturnType<typeof createServiceClient>,
  transaction: {
    customer: { email: string };
    plan: { plan_code: string };
    reference: string;
    amount: number;
  }
) {
  // Find user and update subscription period
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', transaction.customer.email)
    .single();

  if (!user) return;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return;

  // Calculate next period end (1 month from now)
  const nextPeriodEnd = new Date();
  nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: nextPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', membership.organization_id);

  // Get tier for monthly credits
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier_id')
    .eq('organization_id', membership.organization_id)
    .single();

  if (sub?.tier_id) {
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('monthly_credits, name, price_monthly')
      .eq('id', sub.tier_id)
      .single();

    if (tier) {
      // Reset monthly credits
      await supabase.rpc('reset_monthly_credits', { p_org_id: membership.organization_id });

      // Create subscription renewal invoice
      await createInvoice({
        organizationId: membership.organization_id,
        invoiceType: 'subscription',
        lineItems: [{
          description: `${tier.name} Plan — Monthly Subscription`,
          quantity: 1,
          unit_price_cents: tier.price_monthly,
          total_cents: tier.price_monthly,
        }],
        paystackReference: transaction.reference,
        billingEmail: transaction.customer.email,
        creditsGranted: tier.monthly_credits,
      });
    }
  }
}

async function handleTopupPayment(
  supabase: ReturnType<typeof createServiceClient>,
  transaction: {
    customer: { email: string };
    reference: string;
    amount: number;
    metadata: {
      type: string;
      packSlug: string;
      packName: string;
      credits: number;
      organizationId: string;
      userId: string;
    };
  }
) {
  const { metadata } = transaction;
  const orgId = metadata.organizationId;
  const credits = metadata.credits;

  // Create invoice
  const invoiceId = await createInvoice({
    organizationId: orgId,
    invoiceType: 'topup',
    lineItems: [{
      description: `${metadata.packName} — ${credits.toLocaleString()} AI Credits`,
      quantity: 1,
      unit_price_cents: transaction.amount,
      total_cents: transaction.amount,
    }],
    paystackReference: transaction.reference,
    billingEmail: transaction.customer.email,
    creditsGranted: credits,
  });

  // Add topup credits
  await addTopupCredits(
    orgId,
    metadata.userId,
    credits,
    invoiceId,
    `${metadata.packName} — ${credits.toLocaleString()} credits`
  );
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: {
    subscription: { subscription_code: string };
  }
) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('paystack_subscription_code', invoice.subscription.subscription_code);

  if (error) {
    console.error('Failed to update payment failed status:', error);
  }
}
