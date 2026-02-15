'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { InvoiceLineItemRow } from './invoice-line-item-row';
import { InvoiceStatusActions } from './invoice-status-actions';
import { ContactPicker } from '@/components/crm/contact-picker';
import { CompanyPicker } from '@/components/crm/company-picker';

interface InvoiceBuilderProps {
  organizationId: string;
  invoiceId?: string;
  contactId?: string;
  dealId?: string;
  mode: 'create' | 'edit' | 'view';
}

interface LineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  productId?: string;
}

interface BillingInfo {
  name?: string;
  company?: string;
  address_line_1?: string;
  city?: string;
  postal_code?: string;
  email?: string;
  phone?: string;
  vat_number?: string;
}

export function InvoiceBuilder({
  organizationId,
  invoiceId,
  contactId: initialContactId,
  dealId,
  mode,
}: InvoiceBuilderProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPriceCents: 0, totalCents: 0 },
  ]);
  const [loading, setLoading] = useState(!!invoiceId);
  const [saving, setSaving] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState('draft');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [contactId, setContactId] = useState(initialContactId || '');
  const [companyId, setCompanyId] = useState('');
  const [billingFrom, setBillingFrom] = useState<BillingInfo>({});
  const [billingTo, setBillingTo] = useState<BillingInfo>({});
  const [taxRate, setTaxRate] = useState(15);
  const [notes, setNotes] = useState('');
  const [footerText, setFooterText] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const isReadOnly = mode === 'view' || (status !== 'draft' && mode === 'edit');

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    } else {
      generateInvoiceNumber();
    }
    fetchProducts();
  }, [invoiceId]);

  useEffect(() => {
    if (contactId) {
      fetchContactInfo();
    }
  }, [contactId]);

  useEffect(() => {
    if (companyId) {
      fetchCompanyInfo();
    }
  }, [companyId]);

  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    setInvoiceNumber(`INV-${year}${month}-${random}`);
  };

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/invoices/${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        setInvoiceNumber(data.invoice_number || '');
        setStatus(data.status || 'draft');
        setInvoiceDate(data.invoice_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
        setDueDate(data.due_date?.split('T')[0] || '');
        setContactId(data.contact_id || '');
        setCompanyId(data.company_id || '');
        setBillingFrom((data.billing_from as BillingInfo) || {});
        setBillingTo((data.billing_to as BillingInfo) || {});
        setTaxRate(data.tax_rate || 15);
        setNotes(data.notes || '');
        setFooterText(data.footer_text || '');
        setShareToken(data.share_token || null);
        setLineItems(
          data.items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unit_price_cents,
            totalCents: item.total_cents,
            productId: item.product_id,
          })) || [{ description: '', quantity: 1, unitPriceCents: 0, totalCents: 0 }]
        );
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/crm/products?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`);
      if (response.ok) {
        const contact = await response.json();
        setBillingTo({
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
          company: contact.company_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch contact:', error);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(`/api/crm/companies/${companyId}`);
      if (response.ok) {
        const company = await response.json();
        setBillingTo((prev) => ({
          ...prev,
          company: company.name || '',
          address_line_1: company.address_line_1 || '',
          city: company.city || '',
          postal_code: company.postal_code || '',
          vat_number: company.vat_number || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const handleLineItemChange = (index: number, updates: Partial<LineItem>) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], ...updates };
    updated[index].totalCents = updated[index].quantity * updated[index].unitPriceCents;
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPriceCents: 0, totalCents: 0 }]);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.totalCents, 0);
  };

  const calculateTaxAmount = () => {
    return Math.round((calculateSubtotal() * taxRate) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'create') {
        // Create invoice
        const createResponse = await fetch('/api/crm/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            invoiceNumber,
            contactId: contactId || null,
            companyId: companyId || null,
            dealId: dealId || null,
            invoiceDate,
            dueDate: dueDate || null,
            billingFrom,
            billingTo,
            subtotalCents: calculateSubtotal(),
            taxRate,
            taxCents: calculateTaxAmount(),
            totalCents: calculateTotal(),
            notes,
            footerText,
            status: 'draft',
          }),
        });

        if (createResponse.ok) {
          const createdInvoice = await createResponse.json();

          // Add line items
          await fetch(`/api/crm/invoices/${createdInvoice.id}/items`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                totalCents: item.totalCents,
                productId: item.productId || null,
              })),
            }),
          });

          window.location.href = `/crm/invoices/${createdInvoice.id}`;
        }
      } else if (mode === 'edit' && status === 'draft') {
        // Update invoice
        const updateResponse = await fetch(`/api/crm/invoices/${invoiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber,
            contactId: contactId || null,
            companyId: companyId || null,
            invoiceDate,
            dueDate: dueDate || null,
            billingFrom,
            billingTo,
            subtotalCents: calculateSubtotal(),
            taxRate,
            taxCents: calculateTaxAmount(),
            totalCents: calculateTotal(),
            notes,
            footerText,
          }),
        });

        if (updateResponse.ok) {
          // Update line items
          await fetch(`/api/crm/invoices/${invoiceId}/items`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                totalCents: item.totalCents,
                productId: item.productId || null,
              })),
            }),
          });

          await fetchInvoice();
        }
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  if (loading) {
    return <div className="text-center py-12 text-stone-500">Loading invoice...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-dark">
              {mode === 'create' ? 'New Invoice' : `Invoice ${invoiceNumber}`}
            </h2>
            <Badge
              variant="default"
              className={
                status === 'draft'
                  ? 'bg-stone-100 text-stone-700'
                  : status === 'sent'
                  ? 'bg-blue-100 text-blue-700'
                  : status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }
            >
              {status}
            </Badge>
          </div>
          <div className="text-right">
            <label className="block text-sm font-medium text-charcoal mb-1">Invoice Date</label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              disabled={isReadOnly}
              className="w-48"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Billing From */}
          <div>
            <h3 className="text-lg font-semibold text-dark mb-4">Billing From</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
                <Input
                  value={billingFrom.name || ''}
                  onChange={(e) => setBillingFrom({ ...billingFrom, name: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Company</label>
                <Input
                  value={billingFrom.company || ''}
                  onChange={(e) => setBillingFrom({ ...billingFrom, company: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Your company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Address</label>
                <Input
                  value={billingFrom.address_line_1 || ''}
                  onChange={(e) =>
                    setBillingFrom({ ...billingFrom, address_line_1: e.target.value })
                  }
                  disabled={isReadOnly}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">City</label>
                  <Input
                    value={billingFrom.city || ''}
                    onChange={(e) => setBillingFrom({ ...billingFrom, city: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Postal Code</label>
                  <Input
                    value={billingFrom.postal_code || ''}
                    onChange={(e) =>
                      setBillingFrom({ ...billingFrom, postal_code: e.target.value })
                    }
                    disabled={isReadOnly}
                    placeholder="Code"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                <Input
                  type="email"
                  value={billingFrom.email || ''}
                  onChange={(e) => setBillingFrom({ ...billingFrom, email: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
                <Input
                  value={billingFrom.phone || ''}
                  onChange={(e) => setBillingFrom({ ...billingFrom, phone: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="+27 00 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">VAT Number</label>
                <Input
                  value={billingFrom.vat_number || ''}
                  onChange={(e) => setBillingFrom({ ...billingFrom, vat_number: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="VAT number"
                />
              </div>
            </div>
          </div>

          {/* Billing To */}
          <div>
            <h3 className="text-lg font-semibold text-dark mb-4">Billing To</h3>
            {!isReadOnly && (
              <div className="space-y-2 mb-4">
                <ContactPicker
                  organizationId={organizationId}
                  value={contactId || null}
                  onChange={(id) => setContactId(id || '')}
                />
                <CompanyPicker
                  organizationId={organizationId}
                  value={companyId || null}
                  onChange={(id) => setCompanyId(id || '')}
                />
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
                <Input
                  value={billingTo.name || ''}
                  onChange={(e) => setBillingTo({ ...billingTo, name: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Company</label>
                <Input
                  value={billingTo.company || ''}
                  onChange={(e) => setBillingTo({ ...billingTo, company: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Client company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Address</label>
                <Input
                  value={billingTo.address_line_1 || ''}
                  onChange={(e) => setBillingTo({ ...billingTo, address_line_1: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">City</label>
                  <Input
                    value={billingTo.city || ''}
                    onChange={(e) => setBillingTo({ ...billingTo, city: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Postal Code</label>
                  <Input
                    value={billingTo.postal_code || ''}
                    onChange={(e) => setBillingTo({ ...billingTo, postal_code: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="Code"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                <Input
                  type="email"
                  value={billingTo.email || ''}
                  onChange={(e) => setBillingTo({ ...billingTo, email: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
                <Input
                  value={billingTo.phone || ''}
                  onChange={(e) => setBillingTo({ ...billingTo, phone: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="+27 00 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">VAT Number</label>
                <Input
                  value={billingTo.vat_number || ''}
                  onChange={(e) => setBillingTo({ ...billingTo, vat_number: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="VAT number"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">Line Items</h3>
        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <InvoiceLineItemRow
              key={index}
              item={item}
              index={index}
              onChange={handleLineItemChange}
              onRemove={handleRemoveLineItem}
              disabled={isReadOnly}
              products={products}
            />
          ))}
        </div>
        {!isReadOnly && (
          <Button
            variant="default"
            onClick={handleAddLineItem}
            className="mt-4 border-teal text-teal hover:bg-teal/10"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Line Item
          </Button>
        )}

        {/* Totals */}
        <div className="mt-6 space-y-3 max-w-sm ml-auto">
          <div className="flex justify-between text-stone-700">
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between items-center text-stone-700">
            <div className="flex items-center gap-2">
              <span>Tax:</span>
              {!isReadOnly && (
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-20"
                  min="0"
                  max="100"
                  step="0.1"
                />
              )}
              {isReadOnly && <span>{taxRate}%</span>}
            </div>
            <span className="font-medium">{formatCurrency(calculateTaxAmount())}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-dark border-t border-stone-200 pt-3">
            <span>Total:</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Due Date</label>
            <div className="relative">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isReadOnly}
              />
              <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly}
              className="w-full min-h-24 px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Internal notes or payment instructions..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Footer Text</label>
            <textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              disabled={isReadOnly}
              className="w-full min-h-20 px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Thank you message or terms..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-stone-200 p-6">
        {!isReadOnly && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-teal hover:bg-teal/90"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create Invoice' : 'Save Changes'}
          </Button>
        )}
        {invoiceId && (
          <InvoiceStatusActions
            invoiceId={invoiceId}
            status={status}
            shareToken={shareToken}
            onStatusChange={fetchInvoice}
          />
        )}
      </div>
    </div>
  );
}
