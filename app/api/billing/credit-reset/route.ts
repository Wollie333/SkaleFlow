import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Daily cron safety net: reset monthly credits for any orgs whose period has expired.
 * The lazy check in checkCredits() handles most cases, but this ensures
 * no org gets stuck with stale balances if they haven't made an AI call.
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    // Find all credit balances where period has expired
    const { data: expired } = await supabase
      .from('credit_balances')
      .select('organization_id')
      .lt('period_end', new Date().toISOString())
      .gt('monthly_credits_remaining', 0);

    if (!expired || expired.length === 0) {
      return NextResponse.json({ message: 'No expired balances to reset', count: 0 });
    }

    let resetCount = 0;
    for (const row of expired) {
      await supabase.rpc('reset_monthly_credits', { p_org_id: row.organization_id });
      resetCount++;
    }

    return NextResponse.json({ message: `Reset ${resetCount} credit balances`, count: resetCount });
  } catch (error) {
    console.error('Credit reset cron error:', error);
    return NextResponse.json({ error: 'Credit reset failed' }, { status: 500 });
  }
}
