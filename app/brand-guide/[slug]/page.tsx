'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
  background?: string;
  [key: string]: string | undefined;
}

interface Typography {
  heading_font?: string;
  body_font?: string;
  heading_weight?: string;
  body_weight?: string;
  [key: string]: string | undefined;
}

interface DesignSystemColors {
  [key: string]: { hex?: string; rgb?: string; usage?: string } | string | undefined;
}

interface BrandGuideData {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  brand: {
    brand_logo_url?: string;
    brand_color_palette?: ColorPalette;
    brand_typography?: Typography;
    design_system_colors?: DesignSystemColors;
    design_system_components?: unknown;
    visual_mood?: string;
    imagery_direction?: string;
    brand_elements?: string;
    brand_archetype?: string;
  };
}

export default function BrandGuidePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<BrandGuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/brand/visual-guide/${slug}`);
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-400 animate-pulse">Loading brand guide...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Brand Guide Not Found</h1>
          <p className="text-gray-500">This brand guide does not exist or is not public.</p>
        </div>
      </div>
    );
  }

  const { organization, brand } = data;
  const palette = brand.brand_color_palette || {};
  const typography = brand.brand_typography || {};
  const dsColors = brand.design_system_colors || {};
  const logoUrl = (brand.brand_logo_url as string) || organization.logo_url;

  const primary = palette.primary || '#14b8a6';
  const dark = palette.neutral || '#1a1a2e';
  const headingFont = typography.heading_font || 'sans-serif';
  const bodyFont = typography.body_font || 'sans-serif';

  // Build Google Fonts URL
  const fonts = [headingFont, bodyFont].filter(f => f && f !== 'sans-serif' && f !== 'serif');
  const googleFontsUrl = fonts.length > 0
    ? `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join('&')}&display=swap`
    : null;

  // Parse color entries for display
  const paletteEntries = Object.entries(palette).filter(([, v]) => v && typeof v === 'string' && v.startsWith('#'));

  const dsColorEntries = Object.entries(dsColors)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([key, v]) => {
      const obj = v as { hex?: string; rgb?: string; usage?: string };
      return { name: key, hex: obj.hex || '', rgb: obj.rgb || '', usage: obj.usage || '' };
    })
    .filter(c => c.hex);

  return (
    <>
      {googleFontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link href={googleFontsUrl} rel="stylesheet" />
      )}

      <div className="min-h-screen bg-white" style={{ fontFamily: bodyFont }}>
        {/* Hero */}
        <header
          className="py-20 px-6 text-center"
          style={{ backgroundColor: dark, color: '#fff' }}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${organization.name} logo`}
              className="h-16 mx-auto mb-6 object-contain"
            />
          )}
          <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
            Brand Visual Guide
          </p>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: headingFont }}
          >
            {organization.name}
          </h1>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
          {/* Logo Section */}
          {logoUrl && (
            <section>
              <SectionHeader num="01" title="Logo" primary={primary} headingFont={headingFont} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center p-12 rounded-xl border border-stone/10 bg-white">
                  <img src={logoUrl} alt="Logo on light" className="max-h-24 object-contain" />
                </div>
                <div
                  className="flex items-center justify-center p-12 rounded-xl"
                  style={{ backgroundColor: dark }}
                >
                  <img src={logoUrl} alt="Logo on dark" className="max-h-24 object-contain" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Always maintain clear space around the logo. Do not stretch, rotate, or alter the logo colours.
              </p>
            </section>
          )}

          {/* Color Palette */}
          {paletteEntries.length > 0 && (
            <section>
              <SectionHeader num="02" title="Colour Palette" primary={primary} headingFont={headingFont} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {paletteEntries.map(([name, hex]) => (
                  <ColorSwatch key={name} name={name} hex={hex!} />
                ))}
              </div>
            </section>
          )}

          {/* Extended Design System Colors */}
          {dsColorEntries.length > 0 && (
            <section>
              <SectionHeader num="03" title="Extended Colour System" primary={primary} headingFont={headingFont} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {dsColorEntries.map((c) => (
                  <div key={c.name} className="space-y-2">
                    <div
                      className="w-full h-20 rounded-lg border border-stone/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <p className="text-xs font-semibold text-gray-900 capitalize">{c.name.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{c.hex}</p>
                    {c.rgb && <p className="text-[10px] text-gray-400 font-mono">{c.rgb}</p>}
                    {c.usage && <p className="text-[10px] text-gray-500">{c.usage}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Typography */}
          {(typography.heading_font || typography.body_font) && (
            <section>
              <SectionHeader
                num={dsColorEntries.length > 0 ? '04' : '03'}
                title="Typography"
                primary={primary}
                headingFont={headingFont}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {typography.heading_font && (
                  <div className="p-6 rounded-xl border border-stone/10">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Heading Font</p>
                    <p className="text-3xl font-bold mb-2" style={{ fontFamily: headingFont }}>
                      {typography.heading_font}
                    </p>
                    <p className="text-sm text-gray-400" style={{ fontFamily: headingFont }}>
                      Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
                    </p>
                    <p className="text-sm text-gray-400" style={{ fontFamily: headingFont }}>
                      Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                    </p>
                    <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: headingFont }}>
                      0 1 2 3 4 5 6 7 8 9
                    </p>
                  </div>
                )}
                {typography.body_font && (
                  <div className="p-6 rounded-xl border border-stone/10">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Body Font</p>
                    <p className="text-3xl font-bold mb-2" style={{ fontFamily: bodyFont }}>
                      {typography.body_font}
                    </p>
                    <p className="text-sm text-gray-400" style={{ fontFamily: bodyFont }}>
                      Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
                    </p>
                    <p className="text-sm text-gray-400" style={{ fontFamily: bodyFont }}>
                      Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                    </p>
                    <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: bodyFont }}>
                      0 1 2 3 4 5 6 7 8 9
                    </p>
                  </div>
                )}
              </div>

              {/* Type Scale */}
              <div className="mt-8 space-y-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Type Scale</p>
                {[
                  { label: 'H1', size: '2.5rem', weight: 700 },
                  { label: 'H2', size: '2rem', weight: 700 },
                  { label: 'H3', size: '1.5rem', weight: 600 },
                  { label: 'Body', size: '1rem', weight: 400 },
                  { label: 'Small', size: '0.875rem', weight: 400 },
                ].map((t) => (
                  <div key={t.label} className="flex items-baseline gap-4 pb-3 border-b border-gray-50">
                    <span className="text-[10px] font-mono text-gray-400 w-10">{t.label}</span>
                    <span
                      style={{
                        fontFamily: t.label.startsWith('H') ? headingFont : bodyFont,
                        fontSize: t.size,
                        fontWeight: t.weight,
                        color: '#1a1a2e',
                      }}
                    >
                      The quick brown fox
                    </span>
                    <span className="text-[10px] font-mono text-gray-300 ml-auto">{t.size}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Visual Mood & Direction */}
          {(brand.visual_mood || brand.imagery_direction || brand.brand_elements) && (
            <section>
              <SectionHeader
                num={dsColorEntries.length > 0 ? '05' : '04'}
                title="Visual Direction"
                primary={primary}
                headingFont={headingFont}
              />
              <div className="space-y-6">
                {brand.visual_mood && (
                  <div className="p-5 rounded-xl border border-stone/10">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Visual Mood</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {typeof brand.visual_mood === 'string' ? brand.visual_mood : JSON.stringify(brand.visual_mood)}
                    </p>
                  </div>
                )}
                {brand.imagery_direction && (
                  <div className="p-5 rounded-xl border border-stone/10">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Imagery Direction</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {typeof brand.imagery_direction === 'string' ? brand.imagery_direction : JSON.stringify(brand.imagery_direction)}
                    </p>
                  </div>
                )}
                {brand.brand_elements && (
                  <div className="p-5 rounded-xl border border-stone/10">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Brand Elements</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {typeof brand.brand_elements === 'string' ? brand.brand_elements : JSON.stringify(brand.brand_elements)}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="py-8 px-6 text-center border-t border-stone/10">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold">SkaleFlow</span>
          </p>
        </footer>
      </div>
    </>
  );
}

function SectionHeader({ num, title, primary, headingFont }: { num: string; title: string; primary: string; headingFont: string }) {
  return (
    <div className="mb-8 pb-4 border-b border-stone/10">
      <span className="text-xs font-mono font-medium tracking-wider" style={{ color: primary }}>{num}</span>
      <h2 className="text-2xl font-bold mt-1" style={{ fontFamily: headingFont }}>{title}</h2>
    </div>
  );
}

function ColorSwatch({ name, hex }: { name: string; hex: string }) {
  // Determine if text should be light or dark based on background
  const isLight = isLightColor(hex);
  return (
    <div className="space-y-2">
      <div
        className="w-full h-24 rounded-xl border border-stone/10 flex items-end p-3"
        style={{ backgroundColor: hex }}
      >
        <span
          className="text-[10px] font-mono font-medium"
          style={{ color: isLight ? '#1a1a2e' : '#fff' }}
        >
          {hex}
        </span>
      </div>
      <p className="text-xs font-semibold text-gray-900 capitalize">{name.replace(/_/g, ' ')}</p>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
