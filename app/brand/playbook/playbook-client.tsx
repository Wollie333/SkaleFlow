'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { parseBrandOutputs } from '@/lib/playbook/parse-brand-outputs';
import { extractPlaybookTheme } from '@/lib/playbook/playbook-theme';
import { getVariableDescription } from '@/config/variable-descriptions';
import { PlaybookToolbar } from '@/components/playbook/playbook-toolbar';
import { PlaybookCover } from '@/components/playbook/playbook-cover';
import { PlaybookBackCover } from '@/components/playbook/playbook-back-cover';
import { SectionBrandSubstance } from '@/components/playbook/section-brand-substance';
import { SectionAudience } from '@/components/playbook/section-audience';
import { SectionOffer } from '@/components/playbook/section-offer';
import { SectionVoice } from '@/components/playbook/section-voice';
import { SectionVisualIdentity } from '@/components/playbook/section-visual-identity';
import { SectionDesignSystem } from '@/components/playbook/section-design-system';
import { SectionWebsite } from '@/components/playbook/section-website';
import { SectionConversion } from '@/components/playbook/section-conversion';
import type { BrandOutput } from '@/lib/playbook/parse-brand-outputs';

interface PlaybookClientProps {
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    playbookShareToken?: string | null;
  };
  outputs: BrandOutput[];
  phases: { id: string; phase_number: string; phase_name: string }[];
  isPublicView?: boolean;
}

const tocItems = [
  { num: '01', title: 'Brand Substance', desc: 'Purpose, vision, mission, values, archetype' },
  { num: '02', title: 'Audience & Enemy', desc: 'Ideal customer profile and the enemy you fight' },
  { num: '03', title: 'Offer & Positioning', desc: 'What you sell and how you stand apart' },
  { num: '04', title: 'Brand Voice & Messaging', desc: 'How your brand speaks and what it says' },
  { num: '05', title: 'Visual Identity', desc: 'Logo, colors, typography, visual direction' },
  { num: '06', title: 'Design System', desc: 'Implementable design specifications' },
  { num: '07', title: 'Website & Copy', desc: 'Site architecture, page copy, content strategy' },
  { num: '08', title: 'Conversion & Authority', desc: 'Lead flow and trust-building systems' },
];

// Maps each variable key to its playbook section number
const VARIABLE_SECTION_MAP: Record<string, string> = {
  // 01 - Brand Substance
  brand_purpose: '01', brand_vision: '01', brand_mission: '01', brand_values: '01',
  brand_characteristics: '01', brand_archetype: '01', brand_non_negotiables: '01',
  brand_origin_story: '01', founder_story: '01',
  // 02 - Audience & Enemy
  icp_demographics: '02', icp_psychographics: '02', icp_pains: '02', icp_desires: '02',
  icp_emotional_triggers: '02', icp_internal_dialogue: '02', icp_objections: '02',
  icp_buying_triggers: '02', customer_journey_stages: '02',
  enemy_name: '02', enemy_type: '02', enemy_description: '02', enemy_cost: '02',
  enemy_false_promises: '02',
  // 03 - Offer & Positioning
  offer_problem: '03', offer_outcome: '03', offer_inclusions: '03', offer_exclusions: '03',
  offer_name: '03', offer_tagline: '03', offer_transformation_before: '03',
  offer_transformation_after: '03',
  positioning_statement: '03', differentiation_statement: '03', category: '03',
  competitive_landscape: '03',
  lead_magnet_type: '03', lead_magnet_title: '03', lead_magnet_promise: '03',
  lead_magnet_content_outline: '03',
  // 04 - Brand Voice & Messaging
  tone_descriptors: '04', vocabulary_preferred: '04', vocabulary_avoided: '04',
  industry_terms_embrace: '04', industry_terms_reject: '04',
  message_core: '04', message_pillars: '04',
  // 05 - Visual Identity
  brand_logo_primary: '05', brand_logo_dark: '05', brand_logo_light: '05',
  brand_logo_icon: '05', brand_mood_board: '05', brand_patterns: '05',
  brand_logo_url: '05', // legacy
  brand_color_palette: '05', brand_typography: '05',
  visual_mood: '05', imagery_direction: '05', brand_elements: '05',
  visual_inspirations: '05', brand_visual_guidelines: '05',
  // 06 - Design System
  design_system_colors: '06', design_system_typography: '06',
  design_system_components: '06', design_system_animations: '06',
  // 07 - Website & Copy
  website_role: '07', primary_conversion: '07', secondary_conversion: '07',
  traffic_sources: '07', website_sitemap: '07', user_journey: '07',
  content_themes: '07', content_pillars: '07', beliefs_to_teach: '07',
  homepage_hero: '07', homepage_problem: '07', homepage_solution: '07',
  homepage_who_we_help: '07', homepage_proof: '07', homepage_why_us: '07',
  homepage_final_cta: '07',
  sales_page_hero: '07', sales_page_story_pain: '07', sales_page_turn_enemy: '07',
  sales_page_value_stack: '07', sales_page_transformation: '07', sales_page_proof: '07',
  sales_page_faq: '07', sales_page_final_cta: '07',
  about_page_copy: '07', problems_page_copy: '07', results_page_copy: '07',
  apply_page_copy: '07', form_fields: '07', form_cta: '07', reassurance: '07',
  lead_page_headline: '07', lead_page_copy: '07', lead_page_cta: '07',
  // 08 - Conversion & Authority
  authority_pitch: '08', authority_publish_plan: '08', authority_product_ecosystem: '08',
  authority_profile_plan: '08', authority_partnerships: '08',
  conversion_business_type: '08', conversion_strategy: '08', conversion_funnel: '08',
  conversion_metrics: '08',
  conversion_flow: '08', nurture_sequence: '08', authority_assets: '08', authority_gaps: '08',
};

interface SearchEntry {
  key: string;
  displayName: string;
  section: string;
  value: string;
}

export function PlaybookClient({ organization, outputs, isPublicView }: PlaybookClientProps) {
  const data = useMemo(() => parseBrandOutputs(outputs), [outputs]);
  const theme = useMemo(
    () => extractPlaybookTheme(data.brand_color_palette, data.brand_typography, data.design_system_colors),
    [data]
  );

  const fontsLink = theme.googleFontsUrl;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('01');
  const sectionRefs = useRef<Record<string, IntersectionObserverEntry>>({});
  const showSidebar = true; // Always show sidebar, even for public users

  // Compute share URL client-side
  const shareUrl = useMemo(() => {
    if (!organization.playbookShareToken || typeof window === 'undefined') return undefined;
    return `${window.location.origin}/playbook/${organization.playbookShareToken}`;
  }, [organization.playbookShareToken]);

  // Build searchable index from parsed data
  const searchIndex = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];
    const dataRecord = data as Record<string, unknown>;
    for (const [key, val] of Object.entries(dataRecord)) {
      if (val == null) continue;
      const desc = getVariableDescription(key);
      const section = VARIABLE_SECTION_MAP[key] || '01';
      let valueStr: string;
      if (typeof val === 'string') {
        valueStr = val;
      } else if (typeof val === 'object') {
        valueStr = JSON.stringify(val);
      } else {
        valueStr = String(val);
      }
      entries.push({
        key,
        displayName: desc.label,
        section,
        value: valueStr,
      });
    }
    return entries;
  }, [data]);

  // Filter search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(
      (entry) =>
        entry.displayName.toLowerCase().includes(q) ||
        entry.key.toLowerCase().includes(q) ||
        entry.value.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [searchQuery, searchIndex]);

  // IntersectionObserver for active section tracking
  useEffect(() => {
    const sectionIds = tocItems.map((t) => `section-${t.num}`);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sectionRefs.current[entry.target.id] = entry;
        }
        // Find the topmost visible section
        let topSection = '';
        let topY = Infinity;
        for (const id of sectionIds) {
          const e = sectionRefs.current[id];
          if (e && e.isIntersecting && e.boundingClientRect.top < topY) {
            topY = e.boundingClientRect.top;
            topSection = id;
          }
        }
        if (topSection) {
          setActiveSection(topSection.replace('section-', ''));
        }
      },
      { rootMargin: '-80px 0px -40% 0px', threshold: 0 }
    );

    // Observe after a short delay to ensure sections are rendered
    const timer = setTimeout(() => {
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionNum: string) => {
    const el = document.getElementById(`section-${sectionNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Scroll to and highlight a variable row
  const scrollToVariable = useCallback((variableKey: string) => {
    const el = document.querySelector(`[data-variable="${variableKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('playbook-highlight');
      setTimeout(() => el.classList.remove('playbook-highlight'), 2000);
    }
    setSearchQuery('');
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={fontsLink} rel="stylesheet" />

      <div
        className="playbook-container"
        style={theme.cssVariables as React.CSSProperties}
      >
        {/* Fixed sidebar — mirrors dashboard sidebar: fixed left-0 top-0 bottom-0 w-60 */}
        {showSidebar && (
          <aside className="playbook-sidebar fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-stone/10 flex flex-col z-40 print:hidden">
            <nav className="flex-1 p-4 overflow-y-auto">
              {/* Brand playbook label */}
              <div className="mb-4 px-3 py-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal/15 text-teal">
                  Brand Playbook
                </span>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'var(--playbook-neutral, #7A756D)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search variables..."
                  className="w-full pl-8 pr-3 py-2 text-[12px] rounded-lg border outline-none transition-colors"
                  style={{
                    borderColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2)',
                    color: 'var(--playbook-dark, #0F1F1D)',
                    fontFamily: 'var(--playbook-body-font, sans-serif)',
                    backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.03)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--playbook-primary, #1E6B63)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mb-4 max-h-[280px] overflow-y-auto rounded-lg border" style={{ borderColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.12)' }}>
                  {searchResults.map((result) => (
                    <button
                      key={result.key}
                      onClick={() => scrollToVariable(result.key)}
                      className="w-full text-left px-3 py-2.5 transition-colors hover:bg-cream"
                      style={{
                        borderBottom: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)',
                      }}
                    >
                      <p className="text-[11px] font-medium truncate" style={{ color: 'var(--playbook-dark, #0F1F1D)' }}>
                        {result.displayName}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--playbook-neutral, #7A756D)' }}>
                        Section {result.section}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Section heading */}
              <h4 className="px-3 text-xs font-semibold text-teal-dark uppercase tracking-wider mb-2">
                Sections
              </h4>

              {/* Category nav links */}
              <div className="space-y-1">
                {tocItems.map((item) => {
                  const isActive = activeSection === item.num;
                  return (
                    <button
                      key={item.num}
                      onClick={() => scrollToSection(item.num)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-teal/10 text-teal'
                          : 'text-stone hover:bg-cream hover:text-charcoal'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-medium flex-shrink-0 w-5 text-center" style={{ color: 'var(--playbook-primary, #1E6B63)' }}>
                        {item.num}
                      </span>
                      <span className="truncate">
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>
        )}

        {/* Content area — offset by sidebar width when sidebar is shown */}
        <div className={`${showSidebar ? 'ml-60' : ''} print:ml-0`}>
          <PlaybookToolbar
            isPublicView={isPublicView}
            shareUrl={shareUrl}
            organizationId={!isPublicView ? organization.id : undefined}
            sidebarOffset={showSidebar}
          />

          <div className="pt-16 print:pt-0">
            <PlaybookCover
              orgName={organization.name}
              logoUrl={organization.logoUrl}
              brandLogoUrl={(data.brand_logo_primary || data.brand_logo_url) && (data.brand_logo_primary || data.brand_logo_url) !== 'none' ? (data.brand_logo_primary || data.brand_logo_url) : null}
            />

            <div className="max-w-[840px] mx-auto px-10 py-16">
              {/* Table of Contents */}
              <section className="break-before-page mb-20">
                <p
                  className="text-[11px] font-mono uppercase tracking-[0.2em] mb-6"
                  style={{ color: 'var(--playbook-primary, #1E6B63)' }}
                >
                  Contents
                </p>
                <div
                  className="mb-12"
                  style={{
                    width: '100%',
                    height: '1px',
                    background: 'linear-gradient(to right, rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2), transparent)',
                  }}
                />
                <div className="space-y-0">
                  {tocItems.map((item) => (
                    <div
                      key={item.num}
                      className="flex items-baseline gap-6 py-5"
                      style={{ borderBottom: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.08)' }}
                    >
                      <span
                        className="text-[13px] font-mono font-medium flex-shrink-0 w-8"
                        style={{ color: 'var(--playbook-primary, #1E6B63)' }}
                      >
                        {item.num}
                      </span>
                      <div className="flex-1">
                        <p
                          className="text-[17px] font-semibold"
                          style={{
                            color: 'var(--playbook-dark, #0F1F1D)',
                            fontFamily: 'var(--playbook-heading-font)',
                            lineHeight: '1.3',
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-[13px] mt-1"
                          style={{ color: 'var(--playbook-neutral, #7A756D)', lineHeight: '1.5' }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sections */}
              <SectionBrandSubstance data={data} id="section-01" />
              <SectionAudience data={data} id="section-02" />
              <SectionOffer data={data} id="section-03" />
              <SectionVoice data={data} id="section-04" />
              <SectionVisualIdentity data={data} logoUrl={organization.logoUrl} id="section-05" />
              <SectionDesignSystem data={data} id="section-06" />
              <SectionWebsite data={data} id="section-07" />
              <SectionConversion data={data} id="section-08" />
            </div>

            <PlaybookBackCover orgName={organization.name} />
          </div>
        </div>
      </div>
    </>
  );
}
