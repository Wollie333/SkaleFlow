import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializeTransaction, generateReference } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const { planCode } = await request.json();

    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get subscription tier
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('paystack_plan_code', planCode)
      .single();

    if (!tier) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Initialize Paystack transaction
    const transaction = await initializeTransaction({
      email: user.email!,
      amount: tier.price_monthly * 100, // Convert to kobo/cents
      plan: planCode,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/callback`,
      metadata: {
        organization_id: membership.organization_id,
        tier_id: tier.id,
        user_id: user.id,
        type: 'subscription',
        tierName: tier.name,
        monthly_credits: tier.monthly_credits,
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan', value: tier.name },
          { display_name: 'Monthly Credits', variable_name: 'monthly_credits', value: String(tier.monthly_credits) },
        ],
      },
    });

    return NextResponse.json({
      authorization_url: transaction.authorization_url,
      reference: transaction.reference,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize checkout' },
      { status: 500 }
    );
  }
}
