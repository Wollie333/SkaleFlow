import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CATEGORY_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';

interface Props {
  categories: Array<{
    category: BrandAuditCategory;
    score: number;
    rating: BrandAuditRating;
    actionableInsight: string;
  }>;
  overallScore: number;
  overallRating: BrandAuditRating;
}

const RATING_COLORS = { red: '#EF4444', amber: '#F59E0B', green: '#10B981' };

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#0F1F1D', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 11, fontWeight: 'bold', color: '#0F1F1D', marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  scoreNum: { fontSize: 24, fontWeight: 'bold' },
  bar: { height: 6, borderRadius: 3, backgroundColor: '#e5e7eb', flex: 1 },
  barFill: { height: 6, borderRadius: 3 },
  insight: { fontSize: 9, color: '#4b5563', marginTop: 4 },
});

export function ScoringDashboardPage({ categories, overallScore, overallRating }: Props) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Category Scores</Text>

      <View style={styles.grid}>
        {categories.map((cat) => {
          const color = RATING_COLORS[cat.rating];
          return (
            <View key={cat.category} style={[styles.card, { borderColor: color, backgroundColor: `${color}08` }]}>
              <Text style={styles.cardTitle}>{CATEGORY_LABELS[cat.category]}</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreNum, { color }]}>{Math.round(cat.score)}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${cat.score}%`, backgroundColor: color }]} />
                </View>
              </View>
              <Text style={styles.insight}>{cat.actionableInsight}</Text>
            </View>
          );
        })}
      </View>
    </Page>
  );
}
