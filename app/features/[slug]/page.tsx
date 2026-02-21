import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { features, getFeatureBySlug, getAllFeatureSlugs } from '@/data/features';
import { FeaturePage } from '@/components/marketing/feature-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return {};

  const url = `https://manamarketing.co.za/features/${feature.slug}`;

  return {
    title: feature.title,
    description: feature.metaDescription,
    openGraph: {
      title: feature.title,
      description: feature.metaDescription,
      url,
      siteName: 'Mana Marketing',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: feature.title,
      description: feature.metaDescription,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function FeatureSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    notFound();
  }

  return <FeaturePage feature={feature} />;
}
