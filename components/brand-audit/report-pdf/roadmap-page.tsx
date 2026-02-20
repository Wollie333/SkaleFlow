import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CATEGORY_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditCategory } from '@/types/database';

interface Props {
  roadmap: Array<{
    priority: number;
    category: BrandAuditCategory;
    offerName: string | null;
    relevanceDescription: string;
  }>;
  includePricing: boolean;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#0F1F1D', marginBottom: 6 },
  subtitle: { fontSize: 11, color: '#6b7280', marginBottom: 20 },
  item: { flexDirection: 'row', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  priority: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0F766E', justifyContent: 'center', alignItems: 'center' },
  priorityNum: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1 },
  catName: { fontSize: 12, fontWeight: 'bold', color: '#0F1F1D', marginBottom: 4 },
  offerName: { fontSize: 10, fontWeight: 'bold', color: '#C9A84C', marginBottom: 4 },
  description: { fontSize: 9, color: '#4b5563', lineHeight: 1.5 },
});

export function RoadmapPage({ roadmap, includePricing }: Props) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Priority Improvement Roadmap</Text>
      <Text style={styles.subtitle}>Recommended actions ordered by impact</Text>

      {roadmap.map((item) => (
        <View key={item.category} style={styles.item}>
          <View style={styles.priority}>
            <Text style={styles.priorityNum}>{item.priority}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.catName}>{CATEGORY_LABELS[item.category]}</Text>
            {item.offerName && <Text style={styles.offerName}>{item.offerName}</Text>}
            <Text style={styles.description}>{item.relevanceDescription}</Text>
          </View>
        </View>
      ))}
    </Page>
  );
}
