import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF from '@react-pdf/renderer';
import { InvoicePdfDocument } from '@/components/billing/invoice-pdf-document';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get org name for the invoice
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invoice.organization_id)
      .single();

    // Generate PDF
    const pdfStream = await ReactPDF.renderToStream(
      InvoicePdfDocument({
        invoice: {
          ...invoice,
          line_items: (invoice.line_items || []) as Array<{
            description: string;
            quantity: number;
            unit_price_cents: number;
            total_cents: number;
          }>,
        },
        orgName: org?.name || 'Organization',
      })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
