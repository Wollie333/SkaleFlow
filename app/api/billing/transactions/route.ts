import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreditTransactionType } from '@/types/database';

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const typeFilter = searchParams.get('type'); // optional filter

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (typeFilter) {
      query = query.eq('transaction_type', typeFilter as CreditTransactionType);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      transactions: data || [],
      total: count || 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((count || 0) / PAGE_SIZE),
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
