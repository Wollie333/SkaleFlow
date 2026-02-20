import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CATEGORY_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';

interface Props {
  category: {
    category: BrandAuditCategory;
    score: number;
    rating: BrandAuditRating;
    analysis: string;
    keyFinding: string;
    actionableInsight: string;
  };
}

const RATING_COLORS = { red: '#EF4444', amber: '#F59E0B', green: '#10B981' };
const RATING_LABELS = { red: 'Critical', amber: 'Needs Improvement', green: 'Strong' };

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F1F1D' },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreNum: { fontSize: 28, fontWeight: 'bold' },
  ratingPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 9, fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0F1F1D', marginBottom: 6 },
  text: { fontSize: 10, lineHeight: 1.6, color: '#374151' },
  highlight: { padding: 12, borderRadius: 6, marginTop: 8 },
  highlightText: { fontSize: 10, fontWeight: 'bold' },
});

export function CategoryPage({ category }: Props) {
  const color = RATING_COLORS[category.rating];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{CATEGORY_LABELS[category.category]}</Text>
        <View style={styles.scoreBadge}>
          <Text style={[styles.scoreNum, { color }]}>{Math.round(category.score)}</Text>
          <View style={[styles.ratingPill, { backgroundColor: color }]}>
            <Text style={styles.ratingText}>{RATING_LABELS[category.rating]}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis</Text>
        <Text style={styles.text}>{category.analysis}</Text>
      </View>

      <View style={[styles.highlight, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.sectionTitle, { color, marginBottom: 4 }]}>Key Finding</Text>
        <Text style={styles.highlightText}>{category.keyFinding}</Text>
      </View>

      <View style={[styles.highlight, { backgroundColor: '#0F766E15', marginTop: 12 }]}>
        <Text style={[styles.sectionTitle, { color: '#0F766E', marginBottom: 4 }]}>Recommended Action</Text>
        <Text style={[styles.highlightText, { color: '#0F766E' }]}>{category.actionableInsight}</Text>
      </View>
    </Page>
  );
}
