'use client';

import { useState, useCallback } from 'react';

interface ColorSwatch {
  hex: string;
  name: string;
  role: string;
  locked: boolean;
}

export interface ColorPalette {
  name: string;
  primary: string;
  dark_base: string;
  accent: string;
  light: string;
  neutral: string;
  colors: Array<{ hex: string; rgb: string; name: string; role: string }>;
}

interface ColorPalettePickerProps {
  organizationId: string;
  phaseId: string;
  initialPalette?: ColorPalette | null;
  disabled?: boolean;
  onPaletteChange?: (palette: ColorPalette) => void;
}

const DEFAULT_SWATCHES: ColorSwatch[] = [
  { hex: '#1E6B63', name: 'Primary', role: 'Main brand color, CTAs, links', locked: false },
  { hex: '#0F1F1D', name: 'Dark Base', role: 'Backgrounds, text, headers', locked: false },
  { hex: '#C8A86E', name: 'Accent', role: 'Highlights, badges, accents', locked: false },
  { hex: '#F0ECE4', name: 'Light', role: 'Backgrounds, cards, sections', locked: false },
  { hex: '#7A756D', name: 'Neutral', role: 'Body text, borders, muted UI', locked: false },
];

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function randomHSLColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 30 + Math.floor(Math.random() * 50);
  const l = 20 + Math.floor(Math.random() * 60);
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function swatchesToPalette(swatches: ColorSwatch[], name: string): ColorPalette {
  return {
    name,
    primary: swatches[0].hex,
    dark_base: swatches[1].hex,
    accent: swatches[2].hex,
    light: swatches[3].hex,
    neutral: swatches[4].hex,
    colors: swatches.map(s => ({
      hex: s.hex,
      rgb: hexToRgb(s.hex),
      name: s.name,
      role: s.role,
    })),
  };
}

function paletteToSwatches(palette: ColorPalette): ColorSwatch[] {
  const keys: Array<{ key: keyof ColorPalette; name: string; role: string }> = [
    { key: 'primary', name: 'Primary', role: 'Main brand color, CTAs, links' },
    { key: 'dark_base', name: 'Dark Base', role: 'Backgrounds, text, headers' },
    { key: 'accent', name: 'Accent', role: 'Highlights, badges, accents' },
    { key: 'light', name: 'Light', role: 'Backgrounds, cards, sections' },
    { key: 'neutral', name: 'Neutral', role: 'Body text, borders, muted UI' },
  ];
  return keys.map(({ key, name, role }) => {
    const hex = (palette[key] as string) || '#888888';
    const paletteColor = palette.colors?.find(c => c.name === name);
    return {
      hex,
      name: paletteColor?.name || name,
      role: paletteColor?.role || role,
      locked: false,
    };
  });
}

export function ColorPalettePicker({
  organizationId,
  phaseId,
  initialPalette,
  disabled = false,
  onPaletteChange,
}: ColorPalettePickerProps) {
  const [swatches, setSwatches] = useState<ColorSwatch[]>(
    initialPalette ? paletteToSwatches(initialPalette) : DEFAULT_SWATCHES
  );
  const [paletteName, setPaletteName] = useState(initialPalette?.name || 'Brand Palette');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingHex, setEditingHex] = useState<number | null>(null);
  const [hexInputs, setHexInputs] = useState<string[]>(swatches.map(s => s.hex));

  const updateSwatch = useCallback((index: number, hex: string) => {
    setSwatches(prev => {
      const next = [...prev];
      next[index] = { ...next[index], hex };
      return next;
    });
    setHexInputs(prev => {
      const next = [...prev];
      next[index] = hex;
      return next;
    });
    setSaved(false);
  }, []);

  const toggleLock = useCallback((index: number) => {
    if (disabled) return;
    setSwatches(prev => {
      const next = [...prev];
      next[index] = { ...next[index], locked: !next[index].locked };
      return next;
    });
  }, [disabled]);

  const handleGenerate = useCallback(async () => {
    if (disabled) return;
    setGenerating(true);
    setError(null);
    try {
      const lockedColors: Record<string, string> = {};
      swatches.forEach(s => {
        if (s.locked) lockedColors[s.name.toLowerCase().replace(/\s/g, '_')] = s.hex;
      });

      const res = await fetch('/api/brand/generate-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, lockedColors }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate colors');
      }

      const data = await res.json();
      const generated = data.palette;
      const keys = ['primary', 'dark_base', 'accent', 'light', 'neutral'];

      setSwatches(prev => prev.map((s, i) => {
        if (s.locked) return s;
        const key = keys[i];
        const hex = generated[key];
        return { ...s, hex: hex || s.hex };
      }));
      setHexInputs(prev => prev.map((h, i) => {
        if (swatches[i].locked) return h;
        const key = keys[i];
        return generated[key] || h;
      }));
      if (generated.name) setPaletteName(generated.name);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [organizationId, swatches, disabled]);

  const handleRandomize = useCallback(() => {
    if (disabled) return;
    setSwatches(prev => prev.map(s => {
      if (s.locked) return s;
      return { ...s, hex: randomHSLColor() };
    }));
    setHexInputs(prev => prev.map((h, i) => {
      if (swatches[i].locked) return h;
      return randomHSLColor();
    }));
    setSaved(false);
  }, [swatches, disabled]);

  const handleSave = useCallback(async () => {
    if (disabled) return;
    setSaving(true);
    setError(null);
    try {
      const palette = swatchesToPalette(swatches, paletteName);
      const res = await fetch('/api/brand/variable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          phaseId,
          outputKey: 'brand_color_palette',
          action: 'update',
          value: palette,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save palette');
      }

      setSaved(true);
      onPaletteChange?.(palette);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [organizationId, phaseId, swatches, paletteName, disabled, onPaletteChange]);

  const handleHexSubmit = useCallback((index: number) => {
    const raw = hexInputs[index].trim();
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHex(hex)) {
      updateSwatch(index, hex);
    } else {
      setHexInputs(prev => {
        const next = [...prev];
        next[index] = swatches[index].hex;
        return next;
      });
    }
    setEditingHex(null);
  }, [hexInputs, swatches, updateSwatch]);

  return (
    <div className="border border-stone/10 rounded-lg p-4 bg-white">
      {/* Palette name */}
      <div className="mb-3">
        <input
          type="text"
          value={paletteName}
          onChange={e => { setPaletteName(e.target.value); setSaved(false); }}
          disabled={disabled}
          className="text-sm font-semibold text-charcoal bg-transparent border-none outline-none w-full"
          placeholder="Palette Name"
        />
      </div>

      {/* Swatches */}
      <div className="flex flex-col sm:flex-row gap-1 mb-3">
        {swatches.map((swatch, i) => {
          const textColor = getContrastColor(swatch.hex);
          return (
            <div key={i} className="flex-1 min-w-0">
              {/* Color swatch */}
              <div
                className="relative h-28 sm:h-36 rounded-t-lg flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: swatch.hex }}
                onClick={() => {
                  if (disabled) return;
                  const input = document.getElementById(`color-input-${i}`) as HTMLInputElement;
                  input?.click();
                }}
              >
                <input
                  id={`color-input-${i}`}
                  type="color"
                  value={swatch.hex}
                  onChange={e => updateSwatch(i, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={disabled}
                />
                <span className="text-xs font-semibold" style={{ color: textColor }}>
                  {swatch.name}
                </span>
                <span className="text-[10px] mt-1 opacity-70 hidden sm:block text-center px-2" style={{ color: textColor }}>
                  {swatch.role}
                </span>
              </div>

              {/* Hex + Lock row */}
              <div className="flex items-center gap-1 bg-cream-warm rounded-b-lg border border-t-0 border-stone/10 px-2 py-1.5">
                {editingHex === i ? (
                  <input
                    type="text"
                    value={hexInputs[i]}
                    onChange={e => {
                      const val = e.target.value;
                      setHexInputs(prev => { const n = [...prev]; n[i] = val; return n; });
                    }}
                    onBlur={() => handleHexSubmit(i)}
                    onKeyDown={e => { if (e.key === 'Enter') handleHexSubmit(i); }}
                    className="flex-1 min-w-0 text-[11px] font-mono text-charcoal bg-white border border-stone/20 rounded px-1.5 py-0.5 outline-none"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => !disabled && setEditingHex(i)}
                    className="flex-1 min-w-0 text-[11px] font-mono text-charcoal text-left truncate hover:text-teal transition-colors"
                    disabled={disabled}
                  >
                    {swatch.hex.toUpperCase()}
                  </button>
                )}
                <button
                  onClick={() => toggleLock(i)}
                  disabled={disabled}
                  className="p-0.5 rounded hover:bg-stone/10 transition-colors"
                  title={swatch.locked ? 'Unlock (will change on generate)' : 'Lock (keep on generate)'}
                >
                  {swatch.locked ? (
                    <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={disabled || generating}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-teal text-white hover:bg-teal/90 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generating...' : 'Generate'}
        </button>
        <button
          onClick={handleRandomize}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-charcoal/10 text-charcoal hover:bg-charcoal/20 disabled:opacity-50 transition-colors"
        >
          Randomize
        </button>
        <button
          onClick={handleSave}
          disabled={disabled || saving}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-gold text-dark hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Palette'}
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
        {saved && <span className="text-[11px] text-teal">Palette saved to your brand.</span>}
      </div>
    </div>
  );
}
