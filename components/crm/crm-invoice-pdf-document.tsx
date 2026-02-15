import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billingBox: {
    width: '45%',
  },
  billingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  billingText: {
    marginBottom: 3,
    color: '#4a5568',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  col1: {
    width: '5%',
  },
  col2: {
    width: '45%',
  },
  col3: {
    width: '15%',
    textAlign: 'right',
  },
  col4: {
    width: '17.5%',
    textAlign: 'right',
  },
  col5: {
    width: '17.5%',
    textAlign: 'right',
  },
  totalsSection: {
    marginLeft: 'auto',
    width: '40%',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingVertical: 3,
  },
  totalLabel: {
    color: '#4a5568',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#2d3748',
    paddingTop: 8,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
  },
  footerSection: {
    marginBottom: 15,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  footerText: {
    color: '#4a5568',
    lineHeight: 1.5,
  },
  draftWatermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 80,
    color: '#e2e8f0',
    opacity: 0.3,
    fontWeight: 'bold',
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
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

interface Invoice {
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  status: string;
  billing_from: BillingInfo;
  billing_to: BillingInfo;
  items: InvoiceItem[];
  subtotal_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
  notes?: string;
  footer_text?: string;
}

const formatCurrency = (cents: number): string => {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function CrmInvoicePdfDocument({ invoice }: { invoice: Invoice }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Draft Watermark */}
        {invoice.status === 'draft' && (
          <View style={styles.draftWatermark}>
            <Text>DRAFT</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {invoice.billing_from.company || invoice.billing_from.name || 'Company Name'}
          </Text>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <View style={styles.invoiceInfo}>
            <Text>
              <Text style={styles.infoLabel}>Invoice Number:</Text>
              {invoice.invoice_number}
            </Text>
            <Text>
              <Text style={styles.infoLabel}>Date:</Text>
              {formatDate(invoice.invoice_date)}
            </Text>
          </View>
          {invoice.due_date && (
            <View style={styles.invoiceInfo}>
              <Text>
                <Text style={styles.infoLabel}>Due Date:</Text>
                {formatDate(invoice.due_date)}
              </Text>
            </View>
          )}
        </View>

        {/* Billing Section */}
        <View style={styles.billingSection}>
          {/* Billing From */}
          <View style={styles.billingBox}>
            <Text style={styles.billingTitle}>From</Text>
            {invoice.billing_from.name && (
              <Text style={styles.billingText}>{invoice.billing_from.name}</Text>
            )}
            {invoice.billing_from.company && (
              <Text style={styles.billingText}>{invoice.billing_from.company}</Text>
            )}
            {invoice.billing_from.address_line_1 && (
              <Text style={styles.billingText}>{invoice.billing_from.address_line_1}</Text>
            )}
            {(invoice.billing_from.city || invoice.billing_from.postal_code) && (
              <Text style={styles.billingText}>
                {[invoice.billing_from.city, invoice.billing_from.postal_code]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            )}
            {invoice.billing_from.email && (
              <Text style={styles.billingText}>{invoice.billing_from.email}</Text>
            )}
            {invoice.billing_from.phone && (
              <Text style={styles.billingText}>{invoice.billing_from.phone}</Text>
            )}
            {invoice.billing_from.vat_number && (
              <Text style={styles.billingText}>VAT: {invoice.billing_from.vat_number}</Text>
            )}
          </View>

          {/* Billing To */}
          <View style={styles.billingBox}>
            <Text style={styles.billingTitle}>Bill To</Text>
            {invoice.billing_to.name && (
              <Text style={styles.billingText}>{invoice.billing_to.name}</Text>
            )}
            {invoice.billing_to.company && (
              <Text style={styles.billingText}>{invoice.billing_to.company}</Text>
            )}
            {invoice.billing_to.address_line_1 && (
              <Text style={styles.billingText}>{invoice.billing_to.address_line_1}</Text>
            )}
            {(invoice.billing_to.city || invoice.billing_to.postal_code) && (
              <Text style={styles.billingText}>
                {[invoice.billing_to.city, invoice.billing_to.postal_code]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            )}
            {invoice.billing_to.email && (
              <Text style={styles.billingText}>{invoice.billing_to.email}</Text>
            )}
            {invoice.billing_to.phone && (
              <Text style={styles.billingText}>{invoice.billing_to.phone}</Text>
            )}
            {invoice.billing_to.vat_number && (
              <Text style={styles.billingText}>VAT: {invoice.billing_to.vat_number}</Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Description</Text>
            <Text style={styles.col3}>Qty</Text>
            <Text style={styles.col4}>Unit Price</Text>
            <Text style={styles.col5}>Total</Text>
          </View>

          {/* Data Rows */}
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{item.description}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>{formatCurrency(item.unit_price_cents)}</Text>
              <Text style={styles.col5}>{formatCurrency(item.total_cents)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal_cents)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.tax_cents)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total_cents)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {invoice.due_date && (
            <View style={styles.footerSection}>
              <Text style={styles.footerLabel}>Payment Due:</Text>
              <Text style={styles.footerText}>{formatDate(invoice.due_date)}</Text>
            </View>
          )}

          {invoice.notes && (
            <View style={styles.footerSection}>
              <Text style={styles.footerLabel}>Notes:</Text>
              <Text style={styles.footerText}>{invoice.notes}</Text>
            </View>
          )}

          {invoice.footer_text && (
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>{invoice.footer_text}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
