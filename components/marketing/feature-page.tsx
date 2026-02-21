import type { FeaturePageData } from '@/data/features';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { EmotionHero } from '@/components/marketing/feature-page-sections/emotion-hero';
import { PainPoints } from '@/components/marketing/feature-page-sections/pain-points';
import { SolutionIntro } from '@/components/marketing/feature-page-sections/solution-intro';
import { FeaturesGrid } from '@/components/marketing/feature-page-sections/features-grid';
import { BenefitsSection } from '@/components/marketing/feature-page-sections/benefits-section';
import { ProofStrip } from '@/components/marketing/feature-page-sections/proof-strip';
import { FinalCTA } from '@/components/marketing/feature-page-sections/final-cta';

interface FeaturePageProps {
  feature: FeaturePageData;
}

export function FeaturePage({ feature }: FeaturePageProps) {
  return (
    <>
      <MarketingNav />
      <EmotionHero
        label={feature.heroLabel}
        title={feature.heroTitle}
        subtitle={feature.heroSubtitle}
      />
      <PainPoints
        painHeadline={feature.emotionSection.painHeadline}
        painPoints={feature.emotionSection.painPoints}
        empathyParagraph={feature.emotionSection.empathyParagraph}
      />
      <SolutionIntro text={feature.solutionIntro} />
      <FeaturesGrid features={feature.logicSection} headline={feature.logicHeadline} />
      <BenefitsSection benefits={feature.benefitsSection} headline={feature.benefitsHeadline} />
      <ProofStrip
        stat={feature.proofSection.stat}
        statLabel={feature.proofSection.statLabel}
        quote={feature.proofSection.quote}
        quoteAuthor={feature.proofSection.quoteAuthor}
      />
      <FinalCTA
        headline={feature.ctaSection.headline}
        subtitle={feature.ctaSection.subtitle}
      />
      <MarketingFooter />
    </>
  );
}
