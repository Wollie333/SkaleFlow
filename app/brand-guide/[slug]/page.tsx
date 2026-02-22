'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

/* ─── Types ─── */
interface ColorPalette {
  name?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
  background?: string;
  dark_base?: string;
  light?: string;
  [key: string]: string | undefined;
}

interface Typography {
  heading_font?: string;
  body_font?: string;
  heading_weight?: string;
  body_weight?: string;
  [key: string]: string | undefined;
}

interface DesignSystemColor {
  hex?: string;
  rgb?: string;
  usage?: string;
}

interface DesignSystemColors {
  [key: string]: DesignSystemColor | string | undefined;
}

interface DesignSystemTypography {
  base_size?: string;
  scale_ratio?: string;
  line_height?: string;
  sizes?: Record<string, { size: string; weight: string; line_height?: string }>;
  [key: string]: unknown;
}

interface VisualAsset {
  id: string;
  asset_type: string;
  file_url: string;
  file_name: string;
  sort_order: number;
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
    brand_tagline?: string;
    brand_positioning_statement?: string;
    design_system_colors?: DesignSystemColors;
    design_system_typography?: DesignSystemTypography;
    design_system_components?: unknown;
    visual_mood?: string;
    imagery_direction?: string;
    brand_elements?: string;
    brand_archetype?: string;
    visual_inspirations?: string;
    brand_visual_assets_summary?: string;
  };
  visualAssets: VisualAsset[];
}

/* ─── Main Component ─── */
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading brand guide...</p>
        </div>
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

  const { organization, brand, visualAssets } = data;
  const palette = brand.brand_color_palette || {};
  const typography = brand.brand_typography || {};
  const dsColors = brand.design_system_colors || {};
  const dsTypography = brand.design_system_typography || {};
  const logoUrl = (brand.brand_logo_url as string) || organization.logo_url;

  const primary = palette.primary || '#14b8a6';
  const dark = palette.dark_base || palette.neutral || '#1a1a2e';
  const accent = palette.accent || primary;
  const light = palette.light || '#fafafa';
  const headingFont = typography.heading_font || 'sans-serif';
  const bodyFont = typography.body_font || 'sans-serif';

  // Tagline
  const tagline = typeof brand.brand_tagline === 'string'
    ? brand.brand_tagline
    : typeof brand.brand_tagline === 'object' && brand.brand_tagline
      ? JSON.stringify(brand.brand_tagline)
      : '';

  // Google Fonts
  const fonts = [headingFont, bodyFont].filter(f => f && f !== 'sans-serif' && f !== 'serif');
  const googleFontsUrl = fonts.length > 0
    ? `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`).join('&')}&display=swap`
    : null;

  // Parse color entries
  const paletteEntries = Object.entries(palette)
    .filter(([key, v]) => v && typeof v === 'string' && v.startsWith('#') && key !== 'name');

  const dsColorEntries = Object.entries(dsColors)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([key, v]) => {
      const obj = v as DesignSystemColor;
      return { name: key, hex: obj.hex || '', rgb: obj.rgb || '', usage: obj.usage || '' };
    })
    .filter(c => c.hex);

  // Group visual assets
  const logoAssets = visualAssets.filter(a => a.asset_type.startsWith('logo') || a.asset_type === 'primary_logo');
  const patternAssets = visualAssets.filter(a => a.asset_type === 'pattern');
  const moodBoardAssets = visualAssets.filter(a => a.asset_type === 'mood_board');

  // Section numbering
  let sectionNum = 0;
  const nextSection = () => { sectionNum++; return String(sectionNum).padStart(2, '0'); };

  return (
    <>
      {googleFontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link href={googleFontsUrl} rel="stylesheet" />
      )}

      <div className="min-h-screen bg-white" style={{ fontFamily: bodyFont }}>
        {/* ═══ 1. COVER ═══ */}
        <header
          className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden"
          style={{ backgroundColor: dark }}
        >
          {/* Subtle radial glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at center, ${primary}40 0%, transparent 70%)`,
            }}
          />

          <div className="relative z-10 max-w-2xl">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={`${organization.name} logo`}
                className="h-20 md:h-24 mx-auto mb-8 object-contain"
              />
            )}
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-4"
              style={{ color: primary }}
            >
              Brand Visual Guide
            </p>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: headingFont }}
            >
              {organization.name}
            </h1>
            {tagline && (
              <p className="text-lg md:text-xl text-white/50 max-w-md mx-auto leading-relaxed">
                {tagline}
              </p>
            )}
          </div>

          {/* Bottom line */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: `${primary}30` }} />
        </header>

        <div className="max-w-5xl mx-auto px-6 py-20 space-y-28">
          {/* ═══ 2. LOGO USAGE ═══ */}
          {(logoUrl || logoAssets.length > 0) && (
            <Section num={nextSection()} title="Logo Usage" primary={primary} headingFont={headingFont}>
              {/* Primary logo showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center justify-center p-12 rounded-2xl border border-gray-100 bg-white">
                  <img src={getLogoForType('primary_logo', logoAssets, logoUrl)} alt="Logo on light" className="max-h-20 object-contain" />
                </div>
                <div
                  className="flex items-center justify-center p-12 rounded-2xl"
                  style={{ backgroundColor: dark }}
                >
                  <img src={getLogoForType('logo_dark', logoAssets, logoUrl)} alt="Logo on dark" className="max-h-20 object-contain" />
                </div>
                <div
                  className="flex items-center justify-center p-12 rounded-2xl"
                  style={{ backgroundColor: primary }}
                >
                  <img src={getLogoForType('logo_light', logoAssets, logoUrl)} alt="Logo on color" className="max-h-20 object-contain" />
                </div>
              </div>

              {/* Logo icon if available */}
              {logoAssets.some(a => a.asset_type === 'logo_icon') && (
                <div className="mb-8">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Icon Mark</p>
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-gray-100 bg-white">
                    <img
                      src={logoAssets.find(a => a.asset_type === 'logo_icon')!.file_url}
                      alt="Icon mark"
                      className="max-h-12 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Clear space rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <RuleCard title="Clear Space" color={primary}>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Always maintain clear space equal to the height of the logo mark on all sides.
                    This ensures the logo maintains its visual impact.
                  </p>
                </RuleCard>
                <RuleCard title="Usage Guidelines" color={primary}>
                  <div className="space-y-2">
                    <DoDont type="do" text="Use approved logo files only" />
                    <DoDont type="do" text="Maintain aspect ratio when scaling" />
                    <DoDont type="dont" text="Stretch, rotate, or skew the logo" />
                    <DoDont type="dont" text="Apply effects, shadows, or outlines" />
                    <DoDont type="dont" text="Place on busy or low-contrast backgrounds" />
                  </div>
                </RuleCard>
              </div>
            </Section>
          )}

          {/* ═══ 3. COLOR PALETTE ═══ */}
          {paletteEntries.length > 0 && (
            <Section num={nextSection()} title="Colour Palette" primary={primary} headingFont={headingFont}>
              {palette.name && (
                <p className="text-sm text-gray-500 mb-6">
                  <span className="font-medium text-gray-700">{palette.name}</span> — Core brand colours
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                {paletteEntries.map(([name, hex]) => (
                  <PaletteSwatch key={name} name={name} hex={hex!} />
                ))}
              </div>

              {/* Usage guide */}
              <div className="mt-10 p-6 rounded-2xl" style={{ backgroundColor: `${primary}08` }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: primary }}>Colour Roles</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {palette.primary && (
                    <ColorRole hex={palette.primary} name="Primary" desc="CTAs, key UI elements, links" />
                  )}
                  {palette.dark_base && (
                    <ColorRole hex={palette.dark_base} name="Dark Base" desc="Backgrounds, headers, footers" />
                  )}
                  {palette.accent && (
                    <ColorRole hex={palette.accent} name="Accent" desc="Highlights, badges, secondary actions" />
                  )}
                  {palette.light && (
                    <ColorRole hex={palette.light} name="Light" desc="Page backgrounds, card surfaces" />
                  )}
                  {palette.neutral && (
                    <ColorRole hex={palette.neutral} name="Neutral" desc="Body text, borders, dividers" />
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* ═══ 4. EXTENDED COLOURS ═══ */}
          {dsColorEntries.length > 0 && (
            <Section num={nextSection()} title="Extended Colour System" primary={primary} headingFont={headingFont}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {dsColorEntries.map((c) => (
                  <div key={c.name} className="space-y-2.5">
                    <div
                      className="w-full h-24 rounded-xl shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <p className="text-xs font-semibold text-gray-800 capitalize">{c.name.replace(/_/g, ' ')}</p>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-500 font-mono">{c.hex}</p>
                      {c.rgb && <p className="text-[10px] text-gray-400 font-mono">{c.rgb}</p>}
                    </div>
                    {c.usage && <p className="text-[10px] text-gray-500">{c.usage}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ═══ 5. TYPOGRAPHY ═══ */}
          {(typography.heading_font || typography.body_font) && (
            <Section num={nextSection()} title="Typography" primary={primary} headingFont={headingFont}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {typography.heading_font && (
                  <FontCard
                    label="Heading Font"
                    fontName={typography.heading_font}
                    fontFamily={headingFont}
                    weight={typography.heading_weight || '700'}
                    dark={dark}
                    primary={primary}
                  />
                )}
                {typography.body_font && (
                  <FontCard
                    label="Body Font"
                    fontName={typography.body_font}
                    fontFamily={bodyFont}
                    weight={typography.body_weight || '400'}
                    dark={dark}
                    primary={primary}
                  />
                )}
              </div>

              {/* Type scale */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50" style={{ backgroundColor: `${primary}06` }}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: primary }}>Type Scale</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {getTypeScale(dsTypography).map((t) => (
                    <div key={t.label} className="flex items-baseline gap-4 px-6 py-4">
                      <span className="text-[10px] font-mono text-gray-400 w-12 flex-shrink-0">{t.label}</span>
                      <span
                        className="flex-1"
                        style={{
                          fontFamily: t.label.startsWith('H') ? headingFont : bodyFont,
                          fontSize: t.size,
                          fontWeight: t.weight,
                          color: dark,
                          lineHeight: 1.3,
                        }}
                      >
                        The quick brown fox
                      </span>
                      <span className="text-[10px] font-mono text-gray-300 flex-shrink-0">{t.size} / {t.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* ═══ 6. VISUAL DIRECTION ═══ */}
          {(brand.visual_mood || brand.imagery_direction || brand.brand_elements) && (
            <Section num={nextSection()} title="Visual Direction" primary={primary} headingFont={headingFont}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {brand.visual_mood && (
                  <DirectionCard label="Visual Mood" content={brand.visual_mood} primary={primary} dark={dark} />
                )}
                {brand.imagery_direction && (
                  <DirectionCard label="Imagery Direction" content={brand.imagery_direction} primary={primary} dark={dark} />
                )}
                {brand.brand_elements && (
                  <DirectionCard label="Brand Elements" content={brand.brand_elements} primary={primary} dark={dark} />
                )}
                {brand.visual_inspirations && (
                  <DirectionCard label="Visual Inspirations" content={brand.visual_inspirations} primary={primary} dark={dark} />
                )}
              </div>
            </Section>
          )}

          {/* ═══ 7. MOOD BOARD ═══ */}
          {moodBoardAssets.length > 0 && (
            <Section num={nextSection()} title="Mood Board" primary={primary} headingFont={headingFont}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {moodBoardAssets.map((asset, i) => (
                  <div
                    key={asset.id}
                    className={`rounded-2xl overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                  >
                    <img
                      src={asset.file_url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                      style={{ minHeight: i === 0 ? '320px' : '180px' }}
                    />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ═══ 8. PATTERNS & TEXTURES ═══ */}
          {patternAssets.length > 0 && (
            <Section num={nextSection()} title="Patterns & Textures" primary={primary} headingFont={headingFont}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {patternAssets.map((asset) => (
                  <div key={asset.id} className="rounded-2xl overflow-hidden border border-gray-100">
                    <img
                      src={asset.file_url}
                      alt={asset.file_name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-xs text-gray-500 truncate">{asset.file_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ═══ 9. USAGE RULES ═══ */}
          <Section num={nextSection()} title="Usage Rules" primary={primary} headingFont={headingFont}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RuleCard title="Do" color="#22c55e">
                <div className="space-y-2.5">
                  <DoDont type="do" text="Use brand colours consistently across all touchpoints" />
                  <DoDont type="do" text="Maintain the type hierarchy for clarity" />
                  <DoDont type="do" text="Use approved logo variants for different backgrounds" />
                  <DoDont type="do" text="Reference this guide before creating any brand material" />
                  <DoDont type="do" text="Keep visuals aligned with the defined mood and direction" />
                </div>
              </RuleCard>
              <RuleCard title="Don&apos;t" color="#ef4444">
                <div className="space-y-2.5">
                  <DoDont type="dont" text="Use colours outside the approved palette" />
                  <DoDont type="dont" text="Mix brand fonts with unapproved typefaces" />
                  <DoDont type="dont" text="Alter logo colours, proportions, or orientation" />
                  <DoDont type="dont" text="Use low-quality or pixelated brand assets" />
                  <DoDont type="dont" text="Apply the brand inconsistently across channels" />
                </div>
              </RuleCard>
            </div>
          </Section>
        </div>

        {/* ═══ 10. FOOTER ═══ */}
        <footer
          className="py-12 px-6 text-center"
          style={{ backgroundColor: dark }}
        >
          <div className="max-w-md mx-auto">
            {logoUrl && (
              <img src={logoUrl} alt={organization.name} className="h-8 mx-auto mb-4 object-contain opacity-50" />
            )}
            <div className="h-px w-12 mx-auto mb-4" style={{ backgroundColor: `${primary}30` }} />
            <p className="text-[11px] text-white/30">
              Powered by <span className="font-semibold text-white/50">SkaleFlow</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ─── Helper Components ─── */

function Section({
  num,
  title,
  primary,
  headingFont,
  children,
}: {
  num: string;
  title: string;
  primary: string;
  headingFont: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="text-[11px] font-mono font-bold tracking-wider"
            style={{ color: primary }}
          >
            {num}
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: `${primary}20` }} />
        </div>
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: headingFont, color: '#1a1a2e' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function PaletteSwatch({ name, hex }: { name: string; hex: string }) {
  const light = isLightColor(hex);
  return (
    <div className="space-y-3">
      <div
        className="w-full aspect-[4/3] rounded-2xl shadow-sm flex flex-col items-start justify-end p-4"
        style={{ backgroundColor: hex }}
      >
        <span
          className="text-[10px] font-mono font-semibold tracking-wide uppercase"
          style={{ color: light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }}
        >
          {hex}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800 capitalize">{name.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{hexToRgb(hex)}</p>
      </div>
    </div>
  );
}

function ColorRole({ hex, name, desc }: { hex: string; name: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm" style={{ backgroundColor: hex }} />
      <div>
        <p className="text-xs font-semibold text-gray-700">{name}</p>
        <p className="text-[10px] text-gray-400">{desc}</p>
      </div>
    </div>
  );
}

function FontCard({
  label,
  fontName,
  fontFamily,
  weight,
  dark,
  primary,
}: {
  label: string;
  fontName: string;
  fontFamily: string;
  weight: string;
  dark: string;
  primary: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50" style={{ backgroundColor: `${primary}06` }}>
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
      </div>
      <div className="p-6">
        <p className="text-4xl font-bold mb-3" style={{ fontFamily, color: dark }}>
          {fontName}
        </p>
        <p className="text-sm mb-1" style={{ fontFamily, color: '#6b7280' }}>
          Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
        </p>
        <p className="text-sm mb-3" style={{ fontFamily, color: '#6b7280' }}>
          Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
        </p>
        <p className="text-sm" style={{ fontFamily, color: '#9ca3af' }}>
          0 1 2 3 4 5 6 7 8 9 ! @ # $ % & *
        </p>
        <div className="mt-4 pt-3 border-t border-gray-50">
          <span className="text-[10px] font-mono text-gray-400">Weight: {weight}</span>
        </div>
      </div>
    </div>
  );
}

function DirectionCard({
  label,
  content,
  primary,
  dark,
}: {
  label: string;
  content: string;
  primary: string;
  dark: string;
}) {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50" style={{ backgroundColor: `${primary}06` }}>
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: primary }}>{label}</p>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: dark }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function RuleCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50" style={{ backgroundColor: `${color}08` }}>
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>{title}</p>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function DoDont({ type, text }: { type: 'do' | 'dont'; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`text-xs mt-0.5 flex-shrink-0 ${type === 'do' ? 'text-green-500' : 'text-red-400'}`}>
        {type === 'do' ? '✓' : '✗'}
      </span>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

/* ─── Helpers ─── */

function getLogoForType(type: string, assets: VisualAsset[], fallback: string | null): string {
  const match = assets.find(a => a.asset_type === type);
  if (match) return match.file_url;
  // Fall back to primary_logo, then org logo
  const primary = assets.find(a => a.asset_type === 'primary_logo');
  if (primary) return primary.file_url;
  return fallback || '';
}

function getTypeScale(dsTypo: DesignSystemTypography) {
  if (dsTypo.sizes && typeof dsTypo.sizes === 'object') {
    return Object.entries(dsTypo.sizes).map(([label, val]) => ({
      label,
      size: val.size || '1rem',
      weight: Number(val.weight) || 400,
    }));
  }
  // Default scale
  return [
    { label: 'H1', size: '3rem', weight: 800 },
    { label: 'H2', size: '2.25rem', weight: 700 },
    { label: 'H3', size: '1.75rem', weight: 600 },
    { label: 'H4', size: '1.25rem', weight: 600 },
    { label: 'Body', size: '1rem', weight: 400 },
    { label: 'Small', size: '0.875rem', weight: 400 },
    { label: 'Caption', size: '0.75rem', weight: 500 },
  ];
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '';
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
