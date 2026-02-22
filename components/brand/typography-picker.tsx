'use client';

import { useState, useCallback, useEffect } from 'react';

export interface BrandTypography {
  heading_font: string;
  heading_weight: string;
  body_font: string;
  body_weight: string;
  accent_font: string;
  accent_weight: string;
}

interface TypographyPickerProps {
  organizationId: string;
  phaseId: string;
  initialTypography?: BrandTypography | null;
  disabled?: boolean;
  onTypographyChange?: (typography: BrandTypography) => void;
  onSuggestPairing?: () => void;
}

interface FontOption {
  name: string;
  category: 'serif' | 'sans-serif' | 'display';
}

const FONT_OPTIONS: FontOption[] = [
  // Serif
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Cormorant Garamond', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  { name: 'Source Serif 4', category: 'serif' },
  { name: 'DM Serif Display', category: 'serif' },
  { name: 'Crimson Text', category: 'serif' },
  { name: 'EB Garamond', category: 'serif' },
  { name: 'Fraunces', category: 'serif' },
  { name: 'Bitter', category: 'serif' },
  { name: 'Noto Serif', category: 'serif' },
  // Sans-Serif
  { name: 'Inter', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif' },
  { name: 'Manrope', category: 'sans-serif' },
  { name: 'Space Grotesk', category: 'sans-serif' },
  { name: 'Outfit', category: 'sans-serif' },
  { name: 'Sora', category: 'sans-serif' },
  { name: 'Work Sans', category: 'sans-serif' },
  { name: 'Nunito Sans', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Rubik', category: 'sans-serif' },
  { name: 'Figtree', category: 'sans-serif' },
  { name: 'Geist', category: 'sans-serif' },
  // Display
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Oswald', category: 'display' },
  { name: 'Archivo Black', category: 'display' },
  { name: 'Righteous', category: 'display' },
  { name: 'Abril Fatface', category: 'display' },
  { name: 'Dela Gothic One', category: 'display' },
  { name: 'Unbounded', category: 'display' },
  { name: 'Instrument Serif', category: 'display' },
  { name: 'Syne', category: 'display' },
  { name: 'Cabinet Grotesk', category: 'display' },
];

const WEIGHT_OPTIONS = ['300', '400', '500', '600', '700', '800', '900'];

const CATEGORY_LABELS: Record<string, string> = {
  'serif': 'Serif',
  'sans-serif': 'Sans-Serif',
  'display': 'Display',
};

// Track loaded fonts to avoid duplicates
const loadedFonts = new Set<string>();

function loadGoogleFont(fontName: string, weight: string) {
  const key = `${fontName}:${weight}`;
  if (loadedFonts.has(key)) return;
  loadedFonts.add(key);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@${weight}&display=swap`;
  document.head.appendChild(link);
}

function FontSelect({
  label,
  value,
  weight,
  onFontChange,
  onWeightChange,
  disabled,
  previewText,
  previewStyle,
}: {
  label: string;
  value: string;
  weight: string;
  onFontChange: (font: string) => void;
  onWeightChange: (weight: string) => void;
  disabled: boolean;
  previewText: string;
  previewStyle?: React.CSSProperties;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value && weight) loadGoogleFont(value, weight);
  }, [value, weight]);

  const filtered = search
    ? FONT_OPTIONS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : FONT_OPTIONS;

  const grouped = (['serif', 'sans-serif', 'display'] as const).map(cat => ({
    category: cat,
    fonts: filtered.filter(f => f.category === cat),
  })).filter(g => g.fonts.length > 0);

  return (
    <div className="border border-stone/10 rounded-lg p-3 bg-cream-warm">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[11px] font-semibold text-charcoal uppercase tracking-wide w-20 shrink-0">
          {label}
        </span>

        {/* Font selector */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
            className="w-full text-left text-sm text-charcoal bg-white border border-stone/20 rounded-md px-3 py-1.5 hover:border-teal/40 transition-colors disabled:opacity-50"
          >
            {value || 'Select font...'}
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {open && (
            <div className="absolute z-50 top-full mt-1 w-full bg-white border border-stone/20 rounded-lg shadow-lg max-h-60 overflow-hidden">
              <div className="p-2 border-b border-stone/10">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full text-xs bg-cream-warm border border-stone/10 rounded px-2 py-1 outline-none"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-48">
                {grouped.map(group => (
                  <div key={group.category}>
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-stone font-semibold bg-cream-warm">
                      {CATEGORY_LABELS[group.category]}
                    </div>
                    {group.fonts.map(font => (
                      <button
                        key={font.name}
                        onClick={() => {
                          onFontChange(font.name);
                          setOpen(false);
                          setSearch('');
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-teal/5 transition-colors ${
                          font.name === value ? 'text-teal font-medium bg-teal/5' : 'text-charcoal'
                        }`}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                ))}
                {grouped.length === 0 && (
                  <div className="px-3 py-4 text-xs text-stone text-center">No fonts match</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Weight selector */}
        <select
          value={weight}
          onChange={e => onWeightChange(e.target.value)}
          disabled={disabled}
          className="text-xs text-charcoal bg-white border border-stone/20 rounded-md px-2 py-1.5 outline-none disabled:opacity-50"
        >
          {WEIGHT_OPTIONS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* Preview */}
      {value && (
        <div
          className="text-charcoal mt-1 truncate"
          style={{
            fontFamily: `"${value}", ${FONT_OPTIONS.find(f => f.name === value)?.category || 'sans-serif'}`,
            fontWeight: parseInt(weight),
            ...previewStyle,
          }}
        >
          {previewText}
        </div>
      )}
    </div>
  );
}

export function TypographyPicker({
  organizationId,
  phaseId,
  initialTypography,
  disabled = false,
  onTypographyChange,
  onSuggestPairing,
}: TypographyPickerProps) {
  const [headingFont, setHeadingFont] = useState(initialTypography?.heading_font || 'Playfair Display');
  const [headingWeight, setHeadingWeight] = useState(initialTypography?.heading_weight || '700');
  const [bodyFont, setBodyFont] = useState(initialTypography?.body_font || 'Inter');
  const [bodyWeight, setBodyWeight] = useState(initialTypography?.body_weight || '400');
  const [accentFont, setAccentFont] = useState(initialTypography?.accent_font || 'DM Sans');
  const [accentWeight, setAccentWeight] = useState(initialTypography?.accent_weight || '500');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (disabled) return;
    setSaving(true);
    setError(null);
    try {
      const typography: BrandTypography = {
        heading_font: headingFont,
        heading_weight: headingWeight,
        body_font: bodyFont,
        body_weight: bodyWeight,
        accent_font: accentFont,
        accent_weight: accentWeight,
      };

      const res = await fetch('/api/brand/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId,
          outputKey: 'brand_typography',
          action: 'update',
          value: typography,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSaved(true);
      onTypographyChange?.(typography);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [organizationId, phaseId, headingFont, headingWeight, bodyFont, bodyWeight, accentFont, accentWeight, disabled, onTypographyChange]);

  return (
    <div className="border border-stone/10 rounded-lg p-4 bg-white">
      <p className="text-xs font-semibold text-charcoal mb-3">Typography</p>

      <div className="space-y-2 mb-3">
        <FontSelect
          label="Heading"
          value={headingFont}
          weight={headingWeight}
          onFontChange={v => { setHeadingFont(v); setSaved(false); }}
          onWeightChange={v => { setHeadingWeight(v); setSaved(false); }}
          disabled={disabled}
          previewText="The quick brown fox jumps over the lazy dog"
          previewStyle={{ fontSize: '20px', lineHeight: '1.3' }}
        />

        <FontSelect
          label="Body"
          value={bodyFont}
          weight={bodyWeight}
          onFontChange={v => { setBodyFont(v); setSaved(false); }}
          onWeightChange={v => { setBodyWeight(v); setSaved(false); }}
          disabled={disabled}
          previewText="The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs."
          previewStyle={{ fontSize: '14px', lineHeight: '1.6' }}
        />

        <FontSelect
          label="Accent"
          value={accentFont}
          weight={accentWeight}
          onFontChange={v => { setAccentFont(v); setSaved(false); }}
          onWeightChange={v => { setAccentWeight(v); setSaved(false); }}
          disabled={disabled}
          previewText="THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"
          previewStyle={{ fontSize: '12px', letterSpacing: '0.05em', lineHeight: '1.4' }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {onSuggestPairing && (
          <button
            onClick={onSuggestPairing}
            disabled={disabled}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 disabled:opacity-50 transition-colors"
          >
            Suggest Pairing
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={disabled || saving}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-gold text-dark hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Typography'}
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
        {saved && <span className="text-[11px] text-teal">Typography saved to your brand.</span>}
      </div>
    </div>
  );
}
