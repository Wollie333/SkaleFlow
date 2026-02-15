import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { recalculateTotals } from '@/lib/crm/invoices';

export async function GET(
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

    // Get invoice items
    const { data: items, error } = await supabase
      .from('crm_invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice items' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { productId, description, quantity, unitPriceCents } = body;

    if (!description || !quantity || unitPriceCents === undefined) {
      return NextResponse.json(
        { error: 'description, quantity, and unitPriceCents are required' },
        { status: 400 }
      );
    }

    // Calculate total
    const totalCents = quantity * unitPriceCents;

    // Insert item
    const { data: item, error } = await supabase
      .from('crm_invoice_items')
      .insert({
        invoice_id: id,
        product_id: productId || null,
        description,
        quantity,
        unit_price_cents: unitPriceCents,
        total_cents: totalCents,
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate invoice totals
    await recalculateTotals(id);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice item' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 }
      );
    }

    // Delete existing items
    await supabase
      .from('crm_invoice_items')
      .delete()
      .eq('invoice_id', id);

    // Insert new items
    const itemsToInsert = items.map((item, index) => ({
      invoice_id: id,
      product_id: item.productId || null,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents,
      total_cents: item.quantity * item.unitPriceCents,
      sort_order: item.sortOrder !== undefined ? item.sortOrder : index,
    }));

    const { data: newItems, error } = await supabase
      .from('crm_invoice_items')
      .insert(itemsToInsert)
      .select();

    if (error) throw error;

    // Recalculate invoice totals
    await recalculateTotals(id);

    return NextResponse.json(newItems || []);
  } catch (error) {
    console.error('Error replacing invoice items:', error);
    return NextResponse.json(
      { error: 'Failed to replace invoice items' },
      { status: 500 }
    );
  }
}
