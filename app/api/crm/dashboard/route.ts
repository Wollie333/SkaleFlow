import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 });

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Run all queries in parallel
    const [
      contactsRes,
      companiesRes,
      openDealsRes,
      wonDealsThisMonthRes,
      overdueInvoicesRes,
      revenueThisMonthRes,
      revenueLastMonthRes,
      recentActivityRes,
    ] = await Promise.all([
      // Contacts by lifecycle
      supabase
        .from('crm_contacts')
        .select('lifecycle_stage')
        .eq('organization_id', organizationId),
      // Total companies
      supabase
        .from('crm_companies')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      // Open deals
      supabase
        .from('crm_deals')
        .select('value_cents')
        .eq('organization_id', organizationId)
        .eq('status', 'open'),
      // Won deals this month
      supabase
        .from('crm_deals')
        .select('value_cents')
        .eq('organization_id', organizationId)
        .eq('status', 'won')
        .gte('updated_at', startOfMonth),
      // Overdue invoices
      supabase
        .from('crm_invoices')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'overdue'),
      // Revenue this month (paid invoices)
      supabase
        .from('crm_invoices')
        .select('total_cents')
        .eq('organization_id', organizationId)
        .eq('status', 'paid')
        .gte('paid_at', startOfMonth),
      // Revenue last month
      supabase
        .from('crm_invoices')
        .select('total_cents')
        .eq('organization_id', organizationId)
        .eq('status', 'paid')
        .gte('paid_at', startOfLastMonth)
        .lte('paid_at', endOfLastMonth),
      // Recent activity
      supabase
        .from('crm_activity')
        .select('*, users(full_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    // Compute contacts by lifecycle
    const contacts = contactsRes.data || [];
    const contactsByLifecycle: Record<string, number> = {
      lead: 0, prospect: 0, opportunity: 0, customer: 0, churned: 0,
    };
    for (const c of contacts) {
      const stage = c.lifecycle_stage as string;
      if (stage in contactsByLifecycle) contactsByLifecycle[stage]++;
    }

    const openDeals = openDealsRes.data || [];
    const wonDeals = wonDealsThisMonthRes.data || [];

    const stats = {
      contacts_by_lifecycle: contactsByLifecycle,
      total_contacts: contacts.length,
      total_companies: companiesRes.count || 0,
      open_deals_count: openDeals.length,
      open_deals_value: openDeals.reduce((sum, d) => sum + (d.value_cents || 0), 0),
      won_deals_this_month: wonDeals.length,
      won_deals_value_this_month: wonDeals.reduce((sum, d) => sum + (d.value_cents || 0), 0),
      overdue_invoices_count: overdueInvoicesRes.count || 0,
      revenue_this_month: (revenueThisMonthRes.data || []).reduce((sum, i) => sum + (i.total_cents || 0), 0),
      revenue_last_month: (revenueLastMonthRes.data || []).reduce((sum, i) => sum + (i.total_cents || 0), 0),
      recent_activity: recentActivityRes.data || [],
    };

    return NextResponse.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
