import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AuditReportData } from './audit-report-document';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
  },
  container: {
    flex: 1,
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1F1D',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#C9A84C',
    textAlign: 'center',
    marginBottom: 40,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#C9A84C',
    marginBottom: 40,
  },
  clientName: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 40,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 20,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 8,
    color: '#A0AEC0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    color: '#FFFFFF',
  },
});

export function CoverPage({ data }: { data: AuditReportData }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Brand Audit Report</Text>
        <Text style={styles.subtitle}>Comprehensive Brand Health Assessment</Text>
        <View style={styles.divider} />
        <Text style={styles.clientName}>{data.contactName}</Text>
        {data.companyName && <Text style={styles.companyName}>{data.companyName}</Text>}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{data.generatedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Prepared By</Text>
            <Text style={styles.metaValue}>{data.preparedBy}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Overall Score</Text>
            <Text style={[styles.metaValue, { fontSize: 18, fontWeight: 'bold' }]}>
              {Math.round(data.overallScore)}/100
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
}
