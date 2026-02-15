import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { CrmInvoicePdfDocument } from '@/components/crm/crm-invoice-pdf-document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: invoice } = await supabase
      .from('crm_invoices')
      .select('*, crm_invoice_items(*)')
      .eq('id', id)
      .single();

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // Verify org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', invoice.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Transform data for PDF component
    const pdfData = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.created_at,
      due_date: invoice.due_date || undefined,
      status: invoice.status,
      billing_from: (invoice.billing_from || {}) as Record<string, string>,
      billing_to: (invoice.billing_to || {}) as Record<string, string>,
      items: ((invoice.crm_invoice_items || []) as Array<{ description: string; quantity: number; unit_price_cents: number; total_cents: number }>),
      subtotal_cents: invoice.subtotal_cents,
      tax_rate: invoice.tax_rate,
      tax_cents: invoice.tax_cents,
      total_cents: invoice.total_cents,
      notes: invoice.notes || undefined,
      footer_text: invoice.footer_text || undefined,
    };

    const pdfStream = await renderToStream(
      CrmInvoicePdfDocument({ invoice: pdfData })
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
