import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  companyName: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  companyTag: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'right' },
  invoiceNumber: { fontSize: 10, color: '#4b5563', textAlign: 'right', marginTop: 2 },
  invoiceDate: { fontSize: 9, color: '#6b7280', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  billToName: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
  billToDetail: { fontSize: 10, color: '#4b5563', marginTop: 2 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 8 },
  tableHeaderCell: { fontSize: 8, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  tableCell: { fontSize: 10, color: '#111827' },
  tableCellSub: { fontSize: 10, color: '#4b5563' },
  totalsContainer: { marginLeft: 'auto', width: 200, marginTop: 10 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsBorder: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#d1d5db', marginTop: 4 },
  totalsLabel: { fontSize: 9, color: '#6b7280' },
  totalsValue: { fontSize: 10, color: '#111827' },
  totalsFinalLabel: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
  totalsFinalValue: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f9fafb', borderRadius: 4, marginTop: 20 },
  footerText: { fontSize: 9, color: '#6b7280' },
  footerValue: { fontSize: 9, fontWeight: 'bold' },
  reference: { fontSize: 8, color: '#9ca3af', textAlign: 'center', marginTop: 15 },
});

function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

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

export function InvoicePdfDocument({ invoice, orgName }: { invoice: InvoiceData; orgName: string }) {
  const date = new Date(invoice.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Mana Marketing</Text>
            <Text style={styles.companyTag}>26 Knoppiesdoring, Sabie</Text>
            <Text style={styles.companyTag}>Mpumalanga, 1260</Text>
            <Text style={styles.companyTag}>Wollie@ManaMarketing.co.za</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>{date}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.billToName}>{orgName}</Text>
          {invoice.billing_name ? <Text style={styles.billToDetail}>{invoice.billing_name}</Text> : null}
          {invoice.billing_email ? <Text style={styles.billToDetail}>{invoice.billing_email}</Text> : null}
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Total</Text>
        </View>

        {/* Table Rows */}
        {(invoice.line_items || []).map((item: LineItem, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
            <Text style={[styles.tableCellSub, { flex: 1, textAlign: 'center' }]}>{String(item.quantity)}</Text>
            <Text style={[styles.tableCellSub, { flex: 1, textAlign: 'right' }]}>{formatZAR(item.unit_price_cents)}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatZAR(item.total_cents)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal (excl. VAT)</Text>
            <Text style={styles.totalsValue}>{formatZAR(invoice.subtotal_cents)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>VAT (15%)</Text>
            <Text style={styles.totalsValue}>{formatZAR(invoice.vat_cents)}</Text>
          </View>
          <View style={styles.totalsBorder}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>{formatZAR(invoice.total_cents)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {invoice.credits_granted > 0 ? (
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.footerText}>Credits Granted: </Text>
              <Text style={[styles.footerValue, { color: '#0d9488' }]}>{invoice.credits_granted.toLocaleString()}</Text>
            </View>
          ) : <View />}
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.footerText}>Status: </Text>
            <Text style={[styles.footerValue, { color: invoice.status === 'paid' ? '#16a34a' : '#dc2626' }]}>
              {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Reference */}
        {invoice.paystack_reference ? (
          <Text style={styles.reference}>Reference: {invoice.paystack_reference}</Text>
        ) : null}
      </Page>
    </Document>
  );
}
