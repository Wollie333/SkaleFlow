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
    founder_bio: string | null;
    speaking_topics: unknown;
    brand_guidelines_url: string | null;
    hero_tagline: string | null;
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
      <div className="min-h-screen bg-[#faf9f6]">
        {/* Hero skeleton */}
        <div
          className="relative overflow-hidden"
          style={{
            minHeight: '75vh',
            backgroundColor: '#0a0f0e',
          }}
        >
          <div className="flex flex-col items-center justify-center min-h-[75vh] px-5 py-20">
            <div className="w-20 h-20 rounded-2xl bg-white/5 animate-pulse mb-8" />
            <div className="h-3 w-20 bg-white/10 rounded-full mb-6 animate-pulse" />
            <div className="h-10 w-56 md:w-72 bg-white/5 rounded-lg animate-pulse mb-4" />
            <div className="h-4 w-40 bg-white/5 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="max-w-5xl mx-auto px-5 py-16 space-y-8">
          <div className="flex justify-center gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-24 bg-stone/5 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-36 bg-stone/5 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-stone/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center px-5">
          <div className="w-16 h-16 rounded-2xl bg-stone/5 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-stone/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">Press Room Not Found</h1>
          <p className="text-sm text-stone/50">This press room does not exist or is not public.</p>
        </div>
      </div>
    );
  }

  // Extract brand data
  const brandPalette = data.brand?.brand_color_palette as Record<string, unknown> | undefined;
  const primaryColor = (brandPalette?.primary as string) || '#14b8a6';
  const darkBase = (brandPalette?.dark_base as string) || '#0a0f0e';
  const accentColor = (brandPalette?.accent as string) || primaryColor;
  const lightColor = (brandPalette?.light as string) || '#faf9f6';
  const neutralColor = (brandPalette?.neutral as string) || '#6b7280';
  const brandLogo = (data.brand?.brand_logo_primary as string) || (data.brand?.brand_logo_url as string) || data.organization.logo_url;
  const tagline = data.press_kit?.hero_tagline || (data.brand?.brand_tagline as string | undefined);
  const positioningStatement = data.brand?.brand_positioning_statement as string | undefined;

  return (
    <div className="min-h-screen" style={{ backgroundColor: lightColor }}>
      <HeroSection
        orgName={data.organization.name}
        logoUrl={brandLogo}
        tagline={tagline}
        primaryColor={primaryColor}
        darkBase={darkBase}
        accentColor={accentColor}
      />

      <AsSeenInBar outlets={data.outlets} darkBase={darkBase} />

      <LatestNews
        placements={data.placements}
        pressReleases={data.press_releases}
        primaryColor={primaryColor}
        accentColor={accentColor}
        darkBase={darkBase}
        lightColor={lightColor}
      />

      <MediaKitSection
        pressKit={data.press_kit}
        logoUrl={brandLogo}
        primaryColor={primaryColor}
        accentColor={accentColor}
        darkBase={darkBase}
        lightColor={lightColor}
        positioningStatement={positioningStatement}
      />

      <StoryAnglesSection
        storyAngles={data.story_angles}
        primaryColor={primaryColor}
        accentColor={accentColor}
        darkBase={darkBase}
      />

      <InquiryForm
        organizationId={data.organization.id}
        orgName={data.organization.name}
        storyAngles={data.story_angles.map(a => ({ id: a.id, title: a.title }))}
        primaryColor={primaryColor}
        darkBase={darkBase}
        accentColor={accentColor}
      />

      {/* Footer */}
      <footer className="py-8 px-5 text-center" style={{ backgroundColor: darkBase }}>
        <p className="text-[11px] text-white/25">
          Powered by <span className="font-semibold text-white/35">SkaleFlow</span>
        </p>
      </footer>
    </div>
  );
}
