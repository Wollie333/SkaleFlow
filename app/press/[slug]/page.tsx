'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeroSection } from '@/components/authority/newsroom/hero-section';
import { AsSeenInBar } from '@/components/authority/newsroom/as-seen-in-bar';
import { LatestNews } from '@/components/authority/newsroom/latest-news';
import { MediaKitSection } from '@/components/authority/newsroom/media-kit-section';
import { StoryAnglesSection } from '@/components/authority/newsroom/story-angles-section';
import { InquiryForm } from '@/components/authority/newsroom/inquiry-form';

interface NewsroomData {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    industry: string | null;
  };
  press_releases: Array<{
    id: string;
    headline: string;
    subtitle: string | null;
    body_content: string;
    published_at: string | null;
  }>;
  placements: Array<{
    id: string;
    opportunity_name: string;
    target_outlet: string | null;
    category: string;
    reach_tier: string;
    published_at: string | null;
    live_url: string | null;
    confirmed_format: string | null;
    engagement_type: string;
  }>;
  press_kit: {
    company_overview: string | null;
    founder_name: string | null;
    founder_bio: string | null;
    founder_headshot_url: string | null;
    speaking_topics: unknown;
    brand_guidelines_url: string | null;
  } | null;
  story_angles: Array<{
    id: string;
    title: string;
    summary: string | null;
    category: string;
    newsworthiness: number;
  }>;
  brand: Record<string, unknown>;
  outlets: string[];
}

export default function PressPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<NewsroomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/authority/newsroom/${slug}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading press room...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Press Room Not Found</h1>
          <p className="text-gray-500">This press room does not exist or is not public.</p>
        </div>
      </div>
    );
  }

  // Extract primary color from brand palette
  const brandPalette = data.brand?.brand_color_palette as Record<string, unknown> | undefined;
  const primaryColor = (brandPalette?.primary as string) || '#14b8a6';
  const brandLogo = (data.brand?.brand_logo_url as string) || data.organization.logo_url;
  const tagline = data.brand?.brand_tagline as string | undefined;

  return (
    <div className="min-h-screen">
      <HeroSection
        orgName={data.organization.name}
        logoUrl={brandLogo}
        tagline={tagline}
        primaryColor={primaryColor}
      />

      <AsSeenInBar outlets={data.outlets} />

      <LatestNews
        placements={data.placements}
        pressReleases={data.press_releases}
        primaryColor={primaryColor}
      />

      <MediaKitSection
        pressKit={data.press_kit}
        logoUrl={brandLogo}
        primaryColor={primaryColor}
      />

      <StoryAnglesSection
        storyAngles={data.story_angles}
        primaryColor={primaryColor}
      />

      <InquiryForm
        organizationId={data.organization.id}
        storyAngles={data.story_angles.map(a => ({ id: a.id, title: a.title }))}
        primaryColor={primaryColor}
      />

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold">SkaleFlow</span>
        </p>
      </footer>
    </div>
  );
}
