import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { CoverPage } from './cover-page';
import { ExecutiveSummaryPage } from './executive-summary-page';
import { ScoringDashboardPage } from './scoring-dashboard-page';
import { CategoryPage } from './category-page';
import { RoadmapPage } from './roadmap-page';
import { AboutPage } from './about-page';
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/brand-audit/types';
import type { BrandAuditCategory, BrandAuditRating } from '@/types/database';

export interface AuditReportData {
  auditId: string;
  contactName: string;
  companyName: string;
  overallScore: number;
  overallRating: BrandAuditRating;
  executiveSummary: string;
  categories: Array<{
    category: BrandAuditCategory;
    score: number;
    rating: BrandAuditRating;
    analysis: string;
    keyFinding: string;
    actionableInsight: string;
  }>;
  roadmap: Array<{
    priority: number;
    category: BrandAuditCategory;
    offerName: string | null;
    relevanceDescription: string;
  }>;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
    orgName: string;
  };
  includePricing: boolean;
  includeComparison: boolean;
  aboutText: string;
  generatedDate: string;
  preparedBy: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
});

export function AuditReportDocument({ data }: { data: AuditReportData }) {
  const sortedCategories = CATEGORY_ORDER
    .map((cat) => data.categories.find((c) => c.category === cat))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <Document>
      {/* P1: Cover */}
      <CoverPage data={data} />

      {/* P2: Executive Summary */}
      <ExecutiveSummaryPage data={data} />

      {/* P3: Scoring Dashboard */}
      <ScoringDashboardPage categories={sortedCategories} overallScore={data.overallScore} overallRating={data.overallRating} />

      {/* P4-9: Individual Category Pages */}
      {sortedCategories.map((cat) => (
        <CategoryPage key={cat.category} category={cat} />
      ))}

      {/* P10: Roadmap */}
      {data.roadmap.length > 0 && (
        <RoadmapPage roadmap={data.roadmap} includePricing={data.includePricing} />
      )}

      {/* P11: About */}
      <AboutPage branding={data.branding} aboutText={data.aboutText} />
    </Document>
  );
}
