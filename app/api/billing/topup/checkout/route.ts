import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializeTransaction, generateReference } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packSlug, organizationId } = await request.json();

    if (!packSlug || !organizationId) {
      return NextResponse.json({ error: 'packSlug and organizationId are required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only org owners/admins can purchase credits' }, { status: 403 });
    }

    // Get the pack
    const { data: pack } = await supabase
      .from('credit_topup_packs')
      .select('*')
      .eq('slug', packSlug)
      .eq('is_active', true)
      .single();

    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    // Get user email
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build callback URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
    const callbackUrl = `${origin}/billing/callback`;

    // Initialize Paystack transaction
    const reference = generateReference();
    const transaction = await initializeTransaction({
      email: userData.email,
      amount: pack.price_cents, // Paystack expects amount in kobo/cents
      callback_url: callbackUrl,
      metadata: {
        type: 'topup',
        packSlug: pack.slug,
        packName: pack.name,
        credits: pack.credits,
        organizationId,
        userId: user.id,
        custom_fields: [
          { display_name: 'Pack', variable_name: 'pack', value: pack.name },
          { display_name: 'Credits', variable_name: 'credits', value: String(pack.credits) },
        ],
      },
    });

    return NextResponse.json({
      authorizationUrl: transaction.authorization_url,
      reference: transaction.reference,
    });
  } catch (error) {
    console.error('Topup checkout error:', error);
    return NextResponse.json({ error: 'Failed to initialize checkout' }, { status: 500 });
  }
}
