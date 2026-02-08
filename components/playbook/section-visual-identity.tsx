import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { getVariableDescription } from '@/config/variable-descriptions';
import type { ParsedBrandData, ColorPalette, Typography } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  logoUrl?: string | null;
  id?: string;
}

function hexToRgbValues(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return [0, 0, 0, 100];
  const c = Math.round(((1 - rr - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gg - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bb - k) / (1 - k)) * 100);
  return [c, m, y, Math.round(k * 100)];
}

function isLight(r: number, g: number, b: number): boolean {
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function ColorCard({ name, hex, role }: { name: string; hex: string; role: string }) {
  const [r, g, b] = hexToRgbValues(hex);
  const [c, m, y, k] = rgbToCmyk(r, g, b);
  const light = isLight(r, g, b);

  return (
    <div className="rounded-xl overflow-hidden break-inside-avoid" style={{ border: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}>
      <div className="px-4 pt-4 pb-3" style={{ backgroundColor: hex, minHeight: '90px' }}>
        <p
          className="text-base font-bold"
          style={{
            color: light ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
            fontFamily: 'var(--playbook-heading-font)',
            lineHeight: '1.3',
          }}
        >
          {name}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)', lineHeight: '1.4' }}>
          {role}
        </p>
      </div>
      <div className="px-4 py-3 space-y-1" style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.03)' }}>
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.08em' }}>HEX</span>
          <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--playbook-dark)' }}>{hex.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.08em' }}>RGB</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--playbook-dark)' }}>{r}, {g}, {b}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.08em' }}>CMYK</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--playbook-dark)' }}>{c}, {m}, {y}, {k}</span>
        </div>
      </div>
    </div>
  );
}

function LogoDisplay({ logoUrl, orgName }: { logoUrl: string; orgName?: string }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-5">
        <div className="p-10 rounded-xl flex items-center justify-center" style={{ border: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.15)' }}>
          <img src={logoUrl} alt={orgName || 'Logo'} className="max-h-20 max-w-full object-contain" />
        </div>
        <div className="p-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--playbook-dark, #0F1F1D)' }}>
          <img src={logoUrl} alt={orgName || 'Logo'} className="max-h-20 max-w-full object-contain brightness-0 invert" />
        </div>
        <div className="p-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--playbook-primary, #1E6B63)' }}>
          <img src={logoUrl} alt={orgName || 'Logo'} className="max-h-20 max-w-full object-contain brightness-0 invert" />
        </div>
        <div className="p-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.08)' }}>
          <img src={logoUrl} alt={orgName || 'Logo'} className="max-h-20 max-w-full object-contain" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-5 mt-2">
        {['Light', 'Dark', 'Brand', 'Neutral'].map(label => (
          <p key={label} className="text-[11px] text-center" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.02em' }}>
            {label} background
          </p>
        ))}
      </div>
    </div>
  );
}

function ColorPaletteDisplay({ palette }: { palette: ColorPalette }) {
  const colors = [
    { name: 'Primary', hex: palette.primary, role: 'Main brand color, CTAs, links' },
    { name: 'Dark Base', hex: palette.dark_base, role: 'Dark backgrounds, text' },
    { name: 'Accent', hex: palette.accent, role: 'Highlights, badges, accents' },
    { name: 'Light', hex: palette.light, role: 'Backgrounds, light sections' },
    { name: 'Neutral', hex: palette.neutral, role: 'Body text, borders' },
  ].filter(c => c.hex && c.hex.startsWith('#'));

  if (colors.length === 0) return null;

  return (
    <div>
      {palette.name && (
        <p className="text-sm mb-6" style={{ color: 'var(--playbook-neutral)', lineHeight: '1.5' }}>
          {palette.name}
        </p>
      )}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {colors.slice(0, 3).map((color) => (
          <ColorCard key={color.name} {...color} />
        ))}
      </div>
      {colors.length > 3 && (
        <div className="grid grid-cols-2 gap-4">
          {colors.slice(3).map((color) => (
            <ColorCard key={color.name} {...color} />
          ))}
        </div>
      )}
    </div>
  );
}

function TypographyDisplay({ typography }: { typography: Typography }) {
  const alphabet = 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz';

  return (
    <div>
      <div className="grid grid-cols-2 gap-10">
        <div className="break-inside-avoid">
          <p className="text-[11px] font-bold uppercase mb-4" style={{ color: 'var(--playbook-primary)', letterSpacing: '0.12em' }}>
            Heading Font
          </p>
          <p className="text-4xl mb-3" style={{ fontFamily: `'${typography.heading_font}', sans-serif`, fontWeight: typography.heading_weight || '700', color: 'var(--playbook-dark)', lineHeight: '1.15' }}>
            {typography.heading_font}
          </p>
          <p className="text-[11px] font-mono mb-4" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.02em' }}>
            Weight: {typography.heading_weight || '700'}
          </p>
          <p className="text-sm" style={{ fontFamily: `'${typography.heading_font}', sans-serif`, fontWeight: typography.heading_weight || '700', color: 'var(--playbook-dark)', lineHeight: '1.8' }}>
            {alphabet}
          </p>
        </div>

        <div className="break-inside-avoid">
          <p className="text-[11px] font-bold uppercase mb-4" style={{ color: 'var(--playbook-primary)', letterSpacing: '0.12em' }}>
            Body Font
          </p>
          <p className="text-4xl mb-3" style={{ fontFamily: `'${typography.body_font}', sans-serif`, fontWeight: typography.body_weight || '400', color: 'var(--playbook-dark)', lineHeight: '1.15' }}>
            {typography.body_font}
          </p>
          <p className="text-[11px] font-mono mb-4" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.02em' }}>
            Weight: {typography.body_weight || '400'}
          </p>
          <p className="text-sm" style={{ fontFamily: `'${typography.body_font}', sans-serif`, fontWeight: typography.body_weight || '400', color: 'var(--playbook-dark)', lineHeight: '1.8' }}>
            {alphabet}
          </p>
        </div>
      </div>

      <div className="mt-10 p-8 rounded-xl break-inside-avoid" style={{ backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.03)' }}>
        <p className="text-3xl mb-3" style={{ fontFamily: `'${typography.heading_font}', sans-serif`, fontWeight: typography.heading_weight, color: 'var(--playbook-dark)', lineHeight: '1.2', letterSpacing: '-0.01em' }}>
          The quick brown fox jumps
        </p>
        <p className="text-xl mb-3" style={{ fontFamily: `'${typography.heading_font}', sans-serif`, fontWeight: '600', color: 'var(--playbook-dark)', lineHeight: '1.3' }}>
          Over the lazy dog near the riverbank
        </p>
        <p className="text-[15px]" style={{ fontFamily: `'${typography.body_font}', sans-serif`, fontWeight: typography.body_weight, color: 'var(--playbook-neutral)', lineHeight: '1.75' }}>
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.
        </p>
      </div>
    </div>
  );
}

export function SectionVisualIdentity({ data, logoUrl, id }: Props) {
  const hasVisual = data.brand_color_palette || data.brand_typography || logoUrl || data.brand_logo_url || data.visual_mood;
  if (!hasVisual) return null;

  const displayLogo = data.brand_logo_url && data.brand_logo_url !== 'none' ? data.brand_logo_url : logoUrl;

  return (
    <PlaybookSection id={id} number="05" title="Visual Identity" subtitle="Logo, colors, typography, and visual direction">
      {/* Logo — special visual */}
      {displayLogo && (
        <PlaybookRow label="Brand Logo" description="The primary logo mark across different backgrounds." variableKey="brand_logo_url" fullWidth>
          <LogoDisplay logoUrl={displayLogo} />
        </PlaybookRow>
      )}

      {/* Color palette — special visual */}
      {data.brand_color_palette && (
        <PlaybookRow label="Color Palette" description="Primary, dark, accent, light, and neutral colors with hex values." variableKey="brand_color_palette" fullWidth>
          <ColorPaletteDisplay palette={data.brand_color_palette} />
        </PlaybookRow>
      )}

      {/* Typography — special visual */}
      {data.brand_typography && (
        <PlaybookRow label="Typography" description="Heading and body font pairings with specimens." variableKey="brand_typography" fullWidth>
          <TypographyDisplay typography={data.brand_typography} />
        </PlaybookRow>
      )}

      <PlaybookRow {...getVariableDescription('visual_mood')} variableKey="visual_mood" value={data.visual_mood} />
      <PlaybookRow {...getVariableDescription('imagery_direction')} variableKey="imagery_direction" value={data.imagery_direction} />
      <PlaybookRow {...getVariableDescription('brand_elements')} variableKey="brand_elements" value={data.brand_elements} />
      <PlaybookRow {...getVariableDescription('visual_inspirations')} variableKey="visual_inspirations" value={data.visual_inspirations} />
    </PlaybookSection>
  );
}
