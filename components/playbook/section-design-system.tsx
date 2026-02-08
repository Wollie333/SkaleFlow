import { PlaybookSection } from './playbook-section';
import { PlaybookRow } from './playbook-row';
import { SmartContent, OutputBlock } from './output-block';
import type { ParsedBrandData, DesignSystemColors, DesignSystemColor, ColorPalette, TypographyScale } from '@/lib/playbook/parse-brand-outputs';

interface Props {
  data: ParsedBrandData;
  id?: string;
}

/* ─── Color utilities ─── */

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

/* ─── Color entry type ─── */

interface ColorEntry {
  key: string;
  hex: string;
  rgb: string;
  role: string;
  label: string;
}

/* ─── Normalize & build color entries ─── */

function normalizeColor(val: unknown, role: string): DesignSystemColor | null {
  if (!val) return null;
  if (typeof val === 'object' && val !== null && 'hex' in val) {
    const obj = val as DesignSystemColor;
    if (obj.hex && obj.hex.startsWith('#')) return obj;
  }
  if (typeof val === 'string' && val.startsWith('#')) {
    const [r, g, b] = hexToRgbValues(val);
    return { hex: val, rgb: `${r}, ${g}, ${b}`, role };
  }
  return null;
}

/** Extract hex colors mentioned in free-form text (e.g. component guidelines) */
function extractColorsFromText(text?: string): ColorEntry[] {
  if (!text) return [];
  const entries: ColorEntry[] = [];
  const seen = new Set<string>();

  // Match patterns like "Primary: #1E6B63", "Dark Base (#0F1F1D)", "Accent — #C8A86E", "#AABBCC" with optional preceding label
  const regex = /(?:([A-Za-z][A-Za-z /&-]{0,30}?)[\s]*[:–—=>\-]+[\s]*)?#([0-9A-Fa-f]{6})\b/g;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    const hex = `#${match[2]}`;
    const upper = hex.toUpperCase();
    if (seen.has(upper)) continue;
    seen.add(upper);

    const rawLabel = match[1]?.trim();
    const label = rawLabel && rawLabel.length > 1 ? rawLabel.replace(/^[-–—*•]\s*/, '') : `Color ${idx + 1}`;
    const [r, g, b] = hexToRgbValues(hex);

    entries.push({
      key: `text_${idx}`,
      hex,
      rgb: `${r}, ${g}, ${b}`,
      role: '',
      label,
    });
    idx++;
  }

  return entries;
}

/** Strip hex color lines/references from component guidelines text so they don't duplicate */
function stripColorReferences(text: string): string {
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    // Remove lines that are mostly color definitions: "Primary: #1E6B63" etc.
    if (/^[-–—*•]?\s*[A-Za-z][A-Za-z /&-]{0,30}[:–—=>\-]+\s*#[0-9A-Fa-f]{6}\s*$/i.test(trimmed)) return false;
    // Remove lines that are standalone hex codes
    if (/^#[0-9A-Fa-f]{6}\s*$/i.test(trimmed)) return false;
    return true;
  });
  return filtered.join('\n').trim();
}

/** Build color entries from structured data, palette, AND text-extracted colors */
function buildColorEntries(
  designColors?: DesignSystemColors,
  palette?: ColorPalette,
  componentText?: string,
): ColorEntry[] {
  const entries: ColorEntry[] = [];
  const seenHex = new Set<string>();

  const addEntry = (entry: ColorEntry) => {
    const upper = entry.hex.toUpperCase();
    if (seenHex.has(upper)) return;
    seenHex.add(upper);
    entries.push(entry);
  };

  // 1. Try design system colors (richest data)
  if (designColors && typeof designColors === 'object') {
    const map: { key: string; label: string; role: string }[] = [
      { key: 'primary', label: 'Primary', role: 'Main brand color, CTAs, links' },
      { key: 'dark_base', label: 'Dark Base', role: 'Dark backgrounds, text' },
      { key: 'accent', label: 'Accent', role: 'Highlights, badges, accents' },
      { key: 'light', label: 'Light', role: 'Backgrounds, light sections' },
      { key: 'neutral', label: 'Neutral', role: 'Body text, borders' },
    ];

    for (const m of map) {
      const raw = (designColors as unknown as Record<string, unknown>)[m.key];
      const color = normalizeColor(raw, m.role);
      if (color) {
        addEntry({ key: m.key, hex: color.hex, rgb: color.rgb, role: color.role || m.role, label: m.label });
      }
    }
  }

  // 2. Fallback / supplement from brand_color_palette
  if (palette) {
    const map = [
      { key: 'primary', hex: palette.primary, label: 'Primary', role: 'Main brand color, CTAs, links' },
      { key: 'dark_base', hex: palette.dark_base, label: 'Dark Base', role: 'Dark backgrounds, text' },
      { key: 'accent', hex: palette.accent, label: 'Accent', role: 'Highlights, badges, accents' },
      { key: 'light', hex: palette.light, label: 'Light', role: 'Backgrounds, light sections' },
      { key: 'neutral', hex: palette.neutral, label: 'Neutral', role: 'Body text, borders' },
    ];
    for (const m of map) {
      if (m.hex && m.hex.startsWith('#')) {
        const [r, g, b] = hexToRgbValues(m.hex);
        addEntry({ key: m.key, hex: m.hex, rgb: `${r}, ${g}, ${b}`, role: m.role, label: m.label });
      }
    }
  }

  // 3. Extract any hex colors from component guidelines text
  const textColors = extractColorsFromText(componentText);
  for (const tc of textColors) {
    addEntry(tc);
  }

  return entries;
}

/* ─── Color block component ─── */

function ColorBlock({ entry }: { entry: ColorEntry }) {
  const [r, g, b] = hexToRgbValues(entry.hex);
  const rgbStr = entry.rgb || `${r}, ${g}, ${b}`;
  const [c, m, y, k] = rgbToCmyk(r, g, b);
  const light = isLight(r, g, b);

  return (
    <div
      className="rounded-xl overflow-hidden break-inside-avoid"
      style={{ border: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}
    >
      {/* Swatch */}
      <div
        className="px-5 py-5 flex items-end justify-between"
        style={{ backgroundColor: entry.hex, minHeight: '90px' }}
      >
        <p
          className="text-base font-bold"
          style={{
            color: light ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
            fontFamily: 'var(--playbook-heading-font)',
            lineHeight: '1.3',
          }}
        >
          {entry.label}
        </p>
        <span
          className="text-[11px] font-mono font-semibold"
          style={{ color: light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)' }}
        >
          {entry.hex.toUpperCase()}
        </span>
      </div>

      {/* Color codes row */}
      <div
        className="px-5 py-3.5 flex gap-6"
        style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.03)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.08em' }}>HEX</span>
          <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--playbook-dark)' }}>{entry.hex.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.08em' }}>RGB</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--playbook-dark)' }}>{rgbStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.08em' }}>CMYK</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--playbook-dark)' }}>{c}, {m}, {y}, {k}</span>
        </div>
      </div>

      {/* Role description */}
      {entry.role && (
        <div
          className="px-5 py-2.5"
          style={{ borderTop: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)' }}
        >
          <p
            className="text-[11px]"
            style={{ color: 'var(--playbook-neutral)', lineHeight: '1.5' }}
          >
            {entry.role}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Brand Colors section ─── */

function BrandColorsSection({ entries }: { entries: ColorEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="mb-14">
      <h3
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: 'var(--playbook-heading-font)', color: 'var(--playbook-dark)', letterSpacing: '-0.01em' }}
      >
        Brand Colors
      </h3>
      <p
        className="text-[13px] mb-8"
        style={{ color: 'var(--playbook-neutral)', lineHeight: '1.6' }}
      >
        Official brand color palette with print and digital specifications.
      </p>

      {/* Color strip preview — all colors in a row */}
      <div className="flex rounded-lg overflow-hidden mb-6" style={{ height: '32px' }}>
        {entries.map((entry) => (
          <div key={entry.key} className="flex-1" style={{ backgroundColor: entry.hex }} />
        ))}
      </div>

      {/* Color blocks grid */}
      <div className="grid grid-cols-2 gap-4">
        {entries.map((entry) => (
          <ColorBlock key={entry.key} entry={entry} />
        ))}
      </div>
    </div>
  );
}

/* ─── Typography Scale ─── */

function TypographyScaleDisplay({ scale }: { scale: TypographyScale }) {
  const entries = [
    { key: 'display', data: scale.display, label: 'Display' },
    { key: 'heading', data: scale.heading, label: 'Heading' },
    { key: 'subheading', data: scale.subheading, label: 'Subheading' },
    { key: 'body', data: scale.body, label: 'Body' },
    { key: 'small', data: scale.small, label: 'Small' },
    { key: 'caption', data: scale.caption, label: 'Caption' },
  ].filter(e => e.data);

  if (entries.length === 0) return null;

  return (
    <div className="mb-14">
      <h3
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: 'var(--playbook-heading-font)', color: 'var(--playbook-dark)', letterSpacing: '-0.01em' }}
      >
        Typography Scale
      </h3>

      <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}>
        {entries.map(({ key, data, label }, i) => (
          <div
            key={key}
            className="flex items-baseline justify-between px-5 py-4 break-inside-avoid"
            style={{
              borderTop: i > 0 ? '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.08)' : undefined,
              backgroundColor: i % 2 === 0 ? 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.02)' : undefined,
            }}
          >
            <p
              style={{
                fontFamily: `'${data!.font}', sans-serif`,
                fontSize: data!.size,
                fontWeight: data!.weight,
                lineHeight: data!.line_height,
                color: 'var(--playbook-dark)',
              }}
            >
              {label}
            </p>
            <p
              className="text-[11px] font-mono flex-shrink-0 ml-6"
              style={{ color: 'var(--playbook-neutral)', letterSpacing: '0.02em' }}
            >
              {data!.font} &middot; {data!.size} &middot; {data!.weight}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Component Guidelines Parser ─── */

interface ComponentRule {
  key: string;
  label: string;
  description: string;
}

/** Parse component guidelines text into key-value pairs */
function parseComponentRules(text: string): ComponentRule[] {
  const rules: ComponentRule[] = [];

  // Strip color-only lines first
  const cleaned = stripColorReferences(text);
  if (!cleaned) return rules;

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Match "key: value" or "key — value" or "key - value" patterns
    const match = line.match(/^[-–—*•]?\s*([a-zA-Z_][a-zA-Z0-9_ ]*?)[\s]*[:–—]\s*["""]?(.+?)["""]?\s*$/);
    if (match) {
      const rawKey = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      const label = match[1].trim().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      rules.push({ key: rawKey, label, description: match[2].trim() });
    }
  }

  return rules;
}

/** Extract a hex color from a description string */
function extractHex(desc: string): string | null {
  const match = desc.match(/#[0-9A-Fa-f]{6}/);
  return match ? match[0] : null;
}

/** Extract a px value from a description string */
function extractPx(desc: string, keyword?: string): string | null {
  if (keyword) {
    const re = new RegExp(keyword + '[^0-9]*?(\\d+)\\s*px', 'i');
    const m = desc.match(re);
    if (m) return `${m[1]}px`;
  }
  const m = desc.match(/(\d+)\s*px/);
  return m ? `${m[1]}px` : null;
}

/** Extract a ms/timing value */
function extractTiming(desc: string): string | null {
  const m = desc.match(/(\d+)\s*ms/);
  return m ? `${m[1]}ms` : null;
}

/* ─── Visual demo components ─── */

function ButtonDemo({ rule }: { rule: ComponentRule }) {
  const desc = rule.description.toLowerCase();
  const radius = extractPx(rule.description, 'round') || (desc.includes('rounded') ? '12px' : '8px');
  const hoverHex = extractHex(rule.description);
  const timing = extractTiming(rule.description) || '200ms';
  const lift = extractPx(rule.description, 'lift') || (desc.includes('lift') ? '2px' : '0');

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Primary button */}
      <button
        className="px-6 py-2.5 text-[13px] font-semibold cursor-default"
        style={{
          backgroundColor: 'var(--playbook-primary, #1E6B63)',
          color: 'var(--playbook-light, #F0ECE4)',
          borderRadius: radius,
          border: 'none',
          fontFamily: 'var(--playbook-body-font)',
          transition: `all ${timing} ease`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          const t = e.currentTarget;
          t.style.transform = `translateY(-${lift})`;
          t.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          if (hoverHex) t.style.backgroundColor = hoverHex;
        }}
        onMouseLeave={(e) => {
          const t = e.currentTarget;
          t.style.transform = 'translateY(0)';
          t.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          t.style.backgroundColor = 'var(--playbook-primary, #1E6B63)';
        }}
      >
        Primary Button
      </button>

      {/* Secondary / outlined button */}
      <button
        className="px-6 py-2.5 text-[13px] font-semibold cursor-default"
        style={{
          backgroundColor: 'transparent',
          color: 'var(--playbook-primary, #1E6B63)',
          borderRadius: radius,
          border: '1.5px solid var(--playbook-primary, #1E6B63)',
          fontFamily: 'var(--playbook-body-font)',
          transition: `all ${timing} ease`,
        }}
        onMouseEnter={(e) => {
          const t = e.currentTarget;
          t.style.backgroundColor = 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.08)';
          t.style.transform = `translateY(-${lift})`;
        }}
        onMouseLeave={(e) => {
          const t = e.currentTarget;
          t.style.backgroundColor = 'transparent';
          t.style.transform = 'translateY(0)';
        }}
      >
        Secondary Button
      </button>

      {/* Ghost / text button */}
      <button
        className="px-5 py-2.5 text-[13px] font-medium cursor-default"
        style={{
          backgroundColor: 'transparent',
          color: 'var(--playbook-neutral, #7A756D)',
          borderRadius: radius,
          border: 'none',
          fontFamily: 'var(--playbook-body-font)',
          transition: `all ${timing} ease`,
        }}
        onMouseEnter={(e) => {
          const t = e.currentTarget;
          t.style.backgroundColor = 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.08)';
          t.style.color = 'var(--playbook-dark, #0F1F1D)';
        }}
        onMouseLeave={(e) => {
          const t = e.currentTarget;
          t.style.backgroundColor = 'transparent';
          t.style.color = 'var(--playbook-neutral, #7A756D)';
        }}
      >
        Ghost Button
      </button>
    </div>
  );
}

function CardDemo({ rule }: { rule: ComponentRule }) {
  const desc = rule.description.toLowerCase();
  const radius = extractPx(rule.description, 'round') || (desc.includes('rounded-xl') ? '16px' : desc.includes('rounded') ? '12px' : '8px');
  const hasShadow = desc.includes('shadow');
  const shadow = hasShadow
    ? (desc.includes('subtle') ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 16px rgba(0,0,0,0.1)')
    : 'none';
  const hasBorder = desc.includes('border');

  return (
    <div className="flex gap-4">
      {/* Sample card */}
      <div
        className="flex-1 p-5"
        style={{
          borderRadius: radius,
          boxShadow: shadow,
          border: hasBorder ? '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.12)' : 'none',
          backgroundColor: 'white',
        }}
      >
        <div
          className="w-full h-16 rounded-lg mb-3"
          style={{ backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.08)' }}
        />
        <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--playbook-dark)', fontFamily: 'var(--playbook-heading-font)' }}>Card Title</p>
        <p className="text-[11px]" style={{ color: 'var(--playbook-neutral)', lineHeight: '1.5' }}>Description text shows here with the defined styling rules applied.</p>
      </div>

      {/* Card on dark bg */}
      <div
        className="flex-1 p-5"
        style={{
          borderRadius: radius,
          backgroundColor: 'var(--playbook-dark, #0F1F1D)',
        }}
      >
        <div
          className="w-full h-16 rounded-lg mb-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        />
        <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--playbook-light, #F0ECE4)', fontFamily: 'var(--playbook-heading-font)' }}>Dark Variant</p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>Same card structure rendered on a dark background.</p>
      </div>
    </div>
  );
}

function FormDemo({ rule }: { rule: ComponentRule }) {
  const desc = rule.description.toLowerCase();
  const radius = extractPx(rule.description, 'round') || (desc.includes('rounded') ? '10px' : '6px');
  const focusColor = extractHex(rule.description) || 'var(--playbook-primary, #1E6B63)';
  const minimal = desc.includes('minimal');

  return (
    <div className="flex gap-4 max-w-lg">
      <div className="flex-1 flex flex-col gap-3">
        {/* Text input */}
        <input
          type="text"
          placeholder="Text input"
          readOnly
          className="px-4 py-2.5 text-[13px] outline-none"
          style={{
            borderRadius: radius,
            border: minimal ? `1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2)` : `1.5px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.25)`,
            fontFamily: 'var(--playbook-body-font)',
            color: 'var(--playbook-dark)',
            backgroundColor: 'white',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
          }}
          onFocus={(e) => {
            const t = e.currentTarget;
            t.style.borderColor = focusColor;
            t.style.boxShadow = `0 0 0 3px rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.12)`;
          }}
          onBlur={(e) => {
            const t = e.currentTarget;
            t.style.borderColor = minimal
              ? 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2)'
              : 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.25)';
            t.style.boxShadow = 'none';
          }}
        />

        {/* Select */}
        <select
          className="px-4 py-2.5 text-[13px] outline-none appearance-none cursor-default"
          style={{
            borderRadius: radius,
            border: minimal ? `1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2)` : `1.5px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.25)`,
            fontFamily: 'var(--playbook-body-font)',
            color: 'var(--playbook-neutral)',
            backgroundColor: 'white',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
          }}
          onFocus={(e) => {
            const t = e.currentTarget;
            t.style.borderColor = focusColor;
            t.style.boxShadow = `0 0 0 3px rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.12)`;
          }}
          onBlur={(e) => {
            const t = e.currentTarget;
            t.style.borderColor = minimal
              ? 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.2)'
              : 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.25)';
            t.style.boxShadow = 'none';
          }}
        >
          <option>Select option</option>
        </select>
      </div>

      {/* Focused state demo */}
      <div className="flex-1 flex flex-col gap-3">
        <div
          className="px-4 py-2.5 text-[13px]"
          style={{
            borderRadius: radius,
            border: `1.5px solid var(--playbook-primary, #1E6B63)`,
            boxShadow: '0 0 0 3px rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.12)',
            fontFamily: 'var(--playbook-body-font)',
            color: 'var(--playbook-dark)',
            backgroundColor: 'white',
          }}
        >
          Focused state
        </div>
        <p className="text-[10px] italic" style={{ color: 'var(--playbook-neutral)' }}>
          Click inputs above to see focus ring
        </p>
      </div>
    </div>
  );
}

function SpacingDemo({ rule }: { rule: ComponentRule }) {
  const desc = rule.description.toLowerCase();
  const gridMatch = desc.match(/(\d+)\s*px\s*grid/);
  const gridSize = gridMatch ? parseInt(gridMatch[1]) : 8;
  const multiples = [1, 2, 3, 4, 6, 8];

  return (
    <div className="flex flex-col gap-2.5">
      {multiples.map((m) => {
        const px = gridSize * m;
        return (
          <div key={m} className="flex items-center gap-3">
            <span className="text-[11px] font-mono w-12 text-right" style={{ color: 'var(--playbook-neutral)' }}>{px}px</span>
            <div
              style={{
                width: `${px}px`,
                height: '14px',
                borderRadius: '3px',
                backgroundColor: 'var(--playbook-primary, #1E6B63)',
                opacity: 0.15 + (m / multiples.length) * 0.5,
              }}
            />
            <span className="text-[10px]" style={{ color: 'var(--playbook-neutral)' }}>
              {m}x
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HoverStateDemo({ rule }: { rule: ComponentRule }) {
  const hoverHex = extractHex(rule.description) || 'var(--playbook-primary, #1E6B63)';
  const lift = extractPx(rule.description, 'lift') || (rule.description.toLowerCase().includes('lift') ? '2px' : '0');
  const timing = extractTiming(rule.description) || '200ms';

  return (
    <div className="flex items-center gap-4">
      {/* Hover demo box */}
      <div
        className="px-6 py-4 rounded-xl text-[13px] font-medium cursor-default"
        style={{
          backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.06)',
          color: 'var(--playbook-dark)',
          border: '1px solid rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.12)',
          transition: `all ${timing} ease`,
          fontFamily: 'var(--playbook-body-font)',
        }}
        onMouseEnter={(e) => {
          const t = e.currentTarget;
          t.style.backgroundColor = hoverHex;
          t.style.color = 'white';
          t.style.transform = `translateY(-${lift})`;
          t.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          const t = e.currentTarget;
          t.style.backgroundColor = 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.06)';
          t.style.color = 'var(--playbook-dark, #0F1F1D)';
          t.style.transform = 'translateY(0)';
          t.style.boxShadow = 'none';
        }}
      >
        Hover me
      </div>

      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-mono px-2 py-1 rounded"
          style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)', color: 'var(--playbook-neutral)' }}
        >
          {timing}
        </span>
        {lift !== '0' && (
          <span
            className="text-[10px] font-mono px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)', color: 'var(--playbook-neutral)' }}
          >
            lift {lift}
          </span>
        )}
      </div>
    </div>
  );
}

function TransitionDemo({ rule }: { rule: ComponentRule }) {
  const timing = extractTiming(rule.description) || '200ms';
  const desc = rule.description.toLowerCase();
  const easing = desc.includes('ease-out') ? 'ease-out' : desc.includes('ease-in') ? 'ease-in' : 'ease';

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg cursor-default"
        style={{
          backgroundColor: 'var(--playbook-primary, #1E6B63)',
          transition: `all ${timing} ${easing}`,
        }}
        onMouseEnter={(e) => {
          const t = e.currentTarget;
          t.style.borderRadius = '50%';
          t.style.transform = 'scale(1.15)';
          t.style.backgroundColor = 'var(--playbook-accent, #C8A86E)';
        }}
        onMouseLeave={(e) => {
          const t = e.currentTarget;
          t.style.borderRadius = '8px';
          t.style.transform = 'scale(1)';
          t.style.backgroundColor = 'var(--playbook-primary, #1E6B63)';
        }}
      />
      <div>
        <p className="text-[12px] font-medium" style={{ color: 'var(--playbook-dark)' }}>Hover to preview</p>
        <p className="text-[10px] font-mono" style={{ color: 'var(--playbook-neutral)' }}>
          {timing} {easing}
        </p>
      </div>
    </div>
  );
}

function GenericRuleDemo({ rule }: { rule: ComponentRule }) {
  const hex = extractHex(rule.description);
  const px = extractPx(rule.description);

  return (
    <div className="flex items-start gap-3">
      {hex && (
        <div
          className="w-8 h-8 rounded-md flex-shrink-0"
          style={{ backgroundColor: hex, border: '1px solid rgba(0,0,0,0.08)' }}
        />
      )}
      <p className="text-[13px]" style={{ color: 'var(--playbook-dark)', lineHeight: '1.6', fontFamily: 'var(--playbook-body-font)' }}>
        {rule.description}
        {px && !hex && (
          <span className="text-[10px] font-mono ml-2 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)', color: 'var(--playbook-neutral)' }}>
            {px}
          </span>
        )}
      </p>
    </div>
  );
}

/** Route a component rule to the right visual demo */
function RuleDemo({ rule }: { rule: ComponentRule }) {
  const k = rule.key;

  if (k.includes('button')) return <ButtonDemo rule={rule} />;
  if (k.includes('card')) return <CardDemo rule={rule} />;
  if (k.includes('form') || k.includes('input')) return <FormDemo rule={rule} />;
  if (k.includes('spacing') || k.includes('grid')) return <SpacingDemo rule={rule} />;
  if (k.includes('hover')) return <HoverStateDemo rule={rule} />;
  if (k.includes('transition') || k.includes('animation') || k.includes('motion')) return <TransitionDemo rule={rule} />;

  // Fallback: also check description for known keywords
  const desc = rule.description.toLowerCase();
  if (desc.includes('hover') && (desc.includes('lift') || desc.includes('color') || extractHex(rule.description))) return <HoverStateDemo rule={rule} />;

  return <GenericRuleDemo rule={rule} />;
}

/* ─── Component Guidelines with visual demos ─── */

function ComponentGuidelines({ value }: { value?: string }) {
  if (!value) return null;

  const rules = parseComponentRules(value);

  // If no parseable rules, show as plain text fallback
  if (rules.length === 0) {
    const cleaned = stripColorReferences(value);
    if (!cleaned) return null;
    return (
      <div className="mb-14">
        <h3
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: 'var(--playbook-heading-font)', color: 'var(--playbook-dark)', letterSpacing: '-0.01em' }}
        >
          Component Guidelines
        </h3>
        <div
          className="p-6 rounded-xl"
          style={{
            backgroundColor: 'rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.03)',
            border: '1px solid rgba(var(--playbook-primary-rgb, 30, 107, 99), 0.08)',
          }}
        >
          <SmartContent value={cleaned} size="base" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-14">
      <h3
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: 'var(--playbook-heading-font)', color: 'var(--playbook-dark)', letterSpacing: '-0.01em' }}
      >
        Component Guidelines
      </h3>
      <p className="text-[13px] mb-8" style={{ color: 'var(--playbook-neutral)', lineHeight: '1.6' }}>
        Interactive demonstrations of your brand&apos;s design system rules.
      </p>

      <div className="space-y-6">
        {rules.map((rule) => (
          <div
            key={rule.key}
            className="rounded-xl overflow-hidden break-inside-avoid"
            style={{ border: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}
          >
            {/* Rule header */}
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.04)' }}
            >
              <p
                className="text-[13px] font-bold"
                style={{ color: 'var(--playbook-dark)', fontFamily: 'var(--playbook-heading-font)' }}
              >
                {rule.label}
              </p>
              <p
                className="text-[11px] font-mono"
                style={{ color: 'var(--playbook-neutral)', maxWidth: '60%', textAlign: 'right' }}
              >
                {rule.description}
              </p>
            </div>

            {/* Visual demo */}
            <div className="px-5 py-5" style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.015)' }}>
              <RuleDemo rule={rule} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Animation & Motion demos ─── */

function ScrollFadeDemo({ rule }: { rule: ComponentRule }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-14 h-10 rounded-lg"
            style={{
              backgroundColor: 'var(--playbook-primary, #1E6B63)',
              opacity: 0.15 + i * 0.28,
              transition: 'opacity 500ms ease',
            }}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: 'var(--playbook-neutral)' }}>
        Elements fade in sequentially on scroll
      </p>
    </div>
  );
}

function LoadingPulseDemo() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-2 w-48">
        <div
          className="h-4 rounded"
          style={{
            backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.12)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          className="h-4 rounded w-3/4"
          style={{
            backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.08)',
            animation: 'pulse 1.5s ease-in-out infinite 0.2s',
          }}
        />
        <div
          className="h-4 rounded w-1/2"
          style={{
            backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.06)',
            animation: 'pulse 1.5s ease-in-out infinite 0.4s',
          }}
        />
      </div>
      <p className="text-[11px]" style={{ color: 'var(--playbook-neutral)' }}>
        Skeleton pulse for loading states
      </p>
    </div>
  );
}

function AnimationRuleDemo({ rule }: { rule: ComponentRule }) {
  const k = rule.key;
  const desc = rule.description.toLowerCase();

  if (k.includes('scroll') || desc.includes('fade-in') || desc.includes('scroll')) return <ScrollFadeDemo rule={rule} />;
  if (k.includes('loading') || desc.includes('pulse') || desc.includes('skeleton')) return <LoadingPulseDemo />;
  if (k.includes('transition') || desc.includes('hover') || desc.includes('ease')) return <TransitionDemo rule={rule} />;

  return <GenericRuleDemo rule={rule} />;
}

function AnimationGuidelines({ value }: { value?: string }) {
  if (!value) return null;

  const rules = parseComponentRules(value);

  if (rules.length === 0) {
    return <OutputBlock label="Animation & Motion" value={value} />;
  }

  return (
    <div className="mb-14">
      <h3
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: 'var(--playbook-heading-font)', color: 'var(--playbook-dark)', letterSpacing: '-0.01em' }}
      >
        Animation & Motion
      </h3>
      <p className="text-[13px] mb-8" style={{ color: 'var(--playbook-neutral)', lineHeight: '1.6' }}>
        Motion principles and transition specifications.
      </p>

      <div className="space-y-6">
        {rules.map((rule) => (
          <div
            key={rule.key}
            className="rounded-xl overflow-hidden break-inside-avoid"
            style={{ border: '1px solid rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.1)' }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.04)' }}
            >
              <p className="text-[13px] font-bold" style={{ color: 'var(--playbook-dark)', fontFamily: 'var(--playbook-heading-font)' }}>
                {rule.label}
              </p>
              <p className="text-[11px] font-mono" style={{ color: 'var(--playbook-neutral)', maxWidth: '60%', textAlign: 'right' }}>
                {rule.description}
              </p>
            </div>
            <div className="px-5 py-5" style={{ backgroundColor: 'rgba(var(--playbook-neutral-rgb, 122, 117, 109), 0.015)' }}>
              <AnimationRuleDemo rule={rule} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main export ─── */

export function SectionDesignSystem({ data, id }: Props) {
  // Build color entries from all sources: structured data + palette + text extraction
  const colorEntries = buildColorEntries(
    data.design_system_colors,
    data.brand_color_palette,
    data.design_system_components,
  );

  const hasDesign = colorEntries.length > 0 || data.design_system_typography || data.design_system_components || data.design_system_animations;
  if (!hasDesign) return null;

  return (
    <PlaybookSection id={id} number="06" title="Design System" subtitle="Implementable specifications for your brand">
      {colorEntries.length > 0 && (
        <PlaybookRow label="Color System" description="Full color system with HEX, RGB, roles, and usage guidelines." variableKey="design_system_colors" fullWidth>
          <BrandColorsSection entries={colorEntries} />
        </PlaybookRow>
      )}
      {data.design_system_typography && (
        <PlaybookRow label="Typography Scale" description="Complete type scale from display through caption with sizes and weights." variableKey="design_system_typography" fullWidth>
          <TypographyScaleDisplay scale={data.design_system_typography} />
        </PlaybookRow>
      )}
      {data.design_system_components && (
        <PlaybookRow label="Component Patterns" description="Design patterns for buttons, cards, forms, and spacing." variableKey="design_system_components" fullWidth>
          <ComponentGuidelines value={data.design_system_components} />
        </PlaybookRow>
      )}
      {data.design_system_animations && (
        <PlaybookRow label="Animation Guidelines" description="Motion preferences for transitions, scroll effects, and loading states." variableKey="design_system_animations" fullWidth>
          <AnimationGuidelines value={data.design_system_animations} />
        </PlaybookRow>
      )}
    </PlaybookSection>
  );
}
