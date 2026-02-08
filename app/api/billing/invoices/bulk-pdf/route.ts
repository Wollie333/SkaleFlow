import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF from '@react-pdf/renderer';
import JSZip from 'jszip';
import { InvoicePdfDocument } from '@/components/billing/invoice-pdf-document';

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get org name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    const orgName = org?.name || 'Organization';

    // Fetch all invoices for this org
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ error: 'No invoices found' }, { status: 404 });
    }

    const zip = new JSZip();

    for (const invoice of invoices) {
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
          orgName,
        })
      );

      const chunks: Uint8Array[] = [];
      for await (const chunk of pdfStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const pdfBuffer = Buffer.concat(chunks);

      zip.file(`${invoice.invoice_number}.pdf`, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="invoices-${orgName.replace(/[^a-zA-Z0-9]/g, '_')}.zip"`,
      },
    });
  } catch (error) {
    console.error('Bulk invoice PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate ZIP' }, { status: 500 });
  }
}
