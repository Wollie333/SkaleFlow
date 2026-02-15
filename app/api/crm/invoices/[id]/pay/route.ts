import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { markAsPaid } from '@/lib/crm/invoices';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get invoice to verify org membership
    const { data: invoice } = await supabase
      .from('crm_invoices')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', invoice.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    const updated = await markAsPaid(id, invoice.organization_id, user.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark invoice as paid';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
