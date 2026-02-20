'use client';

interface LineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

interface InvoiceData {
  invoice_number: string;
  invoice_type: string;
  status: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  line_items: LineItem[];
  billing_name: string | null;
  billing_email: string | null;
  credits_granted: number;
  created_at: string;
  paystack_reference: string | null;
}

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function InvoiceTemplate({ invoice, orgName }: { invoice: InvoiceData; orgName: string }) {
  const date = new Date(invoice.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto bg-cream-warm p-8" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-stone/10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mana Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">26 Knoppiesdoring, Sabie</p>
          <p className="text-sm text-gray-500">Mpumalanga, 1260</p>
          <p className="text-sm text-gray-500">Wollie@ManaMarketing.co.za</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold text-gray-900">INVOICE</h2>
          <p className="text-sm text-gray-600 mt-1">{invoice.invoice_number}</p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
        <p className="text-gray-900 font-medium">{orgName}</p>
        {invoice.billing_name && <p className="text-gray-600">{invoice.billing_name}</p>}
        {invoice.billing_email && <p className="text-gray-600">{invoice.billing_email}</p>}
      </div>

      {/* Line Items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-stone/10">
            <th className="text-left py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</th>
            <th className="text-center py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
            <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
            <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.line_items || []).map((item, i) => (
            <tr key={i} className="border-b border-stone/10">
              <td className="py-3 text-gray-900">{item.description}</td>
              <td className="py-3 text-center text-gray-600">{item.quantity}</td>
              <td className="py-3 text-right text-gray-600">{formatZAR(item.unit_price_cents)}</td>
              <td className="py-3 text-right text-gray-900 font-medium">{formatZAR(item.total_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-500">Subtotal (excl. VAT)</span>
            <span className="text-gray-900">{formatZAR(invoice.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-500">VAT (15%)</span>
            <span className="text-gray-900">{formatZAR(invoice.vat_cents)}</span>
          </div>
          <div className="flex justify-between py-3 border-t border-stone/20 text-base font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatZAR(invoice.total_cents)}</span>
          </div>
        </div>
      </div>

      {/* Credits & Status */}
      <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-gray-50">
        {invoice.credits_granted > 0 && (
          <div>
            <span className="text-sm text-gray-500">Credits Granted: </span>
            <span className="text-sm font-semibold text-teal">{invoice.credits_granted.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          <span className={`text-sm font-semibold capitalize ${
            invoice.status === 'paid' ? 'text-green-600' :
            invoice.status === 'failed' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Reference */}
      {invoice.paystack_reference && (
        <p className="text-xs text-gray-400 mt-4 text-center">
          Reference: {invoice.paystack_reference}
        </p>
      )}
    </div>
  );
}
