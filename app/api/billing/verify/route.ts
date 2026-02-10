import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyTransaction } from '@/lib/paystack';
import { createInvoice } from '@/lib/billing/invoice-service';
import { addTopupCredits, initializeCreditBalance } from '@/lib/ai/credits';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the transaction with Paystack
    const transaction = await verifyTransaction(reference);

    if (transaction.status !== 'success') {
      return NextResponse.json(
        { error: 'Transaction not successful' },
        { status: 400 }
      );
    }

    // Check if the webhook already processed this payment (idempotency)
    // If not, handle it here as a fallback (e.g. local dev where webhooks can't reach)
    const serviceSupabase = createServiceClient();
    const { data: existingInvoice } = await serviceSupabase
      .from('invoices')
      .select('id')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (!existingInvoice) {
      const metadata = (transaction.metadata || {}) as Record<string, unknown>;

      if (metadata.type === 'topup') {
        // Handle topup payment
        const orgId = metadata.organizationId as string;
        const credits = Number(metadata.credits) || 0;
        const packName = (metadata.packName as string) || 'Credit Top-Up';

        if (orgId && credits > 0) {
          const invoiceId = await createInvoice({
            organizationId: orgId,
            invoiceType: 'topup',
            lineItems: [{
              description: `${packName} — ${credits.toLocaleString()} AI Credits`,
              quantity: 1,
              unit_price_cents: transaction.amount,
              total_cents: transaction.amount,
            }],
            paystackReference: reference,
            billingEmail: transaction.customer.email,
            creditsGranted: credits,
          });

          await addTopupCredits(
            orgId,
            (metadata.userId as string) || user.id,
            credits,
            invoiceId,
            `${packName} — ${credits.toLocaleString()} credits`
          );
        }
      } else if (metadata.type === 'subscription' || transaction.plan) {
        // Handle subscription payment
        const orgId = metadata.organization_id as string;
        const tierId = metadata.tier_id as string;

        if (orgId && tierId) {
          const { data: tier } = await serviceSupabase
            .from('subscription_tiers')
            .select('id, name, price_monthly, monthly_credits')
            .eq('id', tierId)
            .single();

          if (tier) {
            // Upsert subscription
            await serviceSupabase
              .from('subscriptions')
              .upsert({
                organization_id: orgId,
                tier_id: tier.id,
                status: 'active',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'organization_id',
              });

            // Initialize credit balance
            if (tier.monthly_credits > 0) {
              await initializeCreditBalance(orgId, tier.monthly_credits);
            }

            // Create invoice
            await createInvoice({
              organizationId: orgId,
              invoiceType: 'subscription',
              lineItems: [{
                description: `${tier.name} Plan — Monthly Subscription`,
                quantity: 1,
                unit_price_cents: tier.price_monthly,
                total_cents: tier.price_monthly,
              }],
              paystackReference: reference,
              billingEmail: transaction.customer.email,
              creditsGranted: tier.monthly_credits,
            });
          }
        }
      }
    }

    // Return details for the callback page
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      reference: transaction.reference,
      amount: transaction.amount,
      metadata: transaction.metadata || {},
      plan: transaction.plan || null,
      customer: transaction.customer,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
