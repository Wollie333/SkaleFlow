import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AuditReportData } from './audit-report-document';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#0F1F1D', marginBottom: 20 },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#F5F3EE',
  },
  scoreNumber: { fontSize: 48, fontWeight: 'bold' },
  scoreLabel: { fontSize: 14, color: '#6b7280', marginLeft: 10 },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 15,
  },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', textTransform: 'uppercase' },
  summaryText: { fontSize: 11, lineHeight: 1.6, color: '#374151' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0F1F1D', marginBottom: 8 },
});

const RATING_COLORS = { red: '#EF4444', amber: '#F59E0B', green: '#10B981' };

export function ExecutiveSummaryPage({ data }: { data: AuditReportData }) {
  const color = RATING_COLORS[data.overallRating] || RATING_COLORS.red;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Executive Summary</Text>

      <View style={styles.scoreBox}>
        <Text style={[styles.scoreNumber, { color }]}>{Math.round(data.overallScore)}</Text>
        <Text style={styles.scoreLabel}>/100</Text>
        <View style={[styles.ratingBadge, { backgroundColor: color }]}>
          <Text style={styles.ratingText}>{data.overallRating}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.summaryText}>{data.executiveSummary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Findings</Text>
        {data.categories.map((cat) => (
          <View key={cat.category} style={{ flexDirection: 'row', marginBottom: 6, gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: RATING_COLORS[cat.rating], marginTop: 3 }} />
            <Text style={{ flex: 1, fontSize: 10, color: '#374151' }}>{cat.keyFinding}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
