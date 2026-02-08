import type { ColorPalette, Typography, DesignSystemColors } from './parse-brand-outputs';

export interface PlaybookTheme {
  colors: {
    primary: string;
    darkBase: string;
    accent: string;
    light: string;
    neutral: string;
  };
  fonts: {
    heading: string;
    headingWeight: string;
    body: string;
    bodyWeight: string;
  };
  googleFontsUrl: string;
  cssVariables: Record<string, string>;
}

// SkaleFlow defaults (matches tailwind.config.ts)
const DEFAULT_THEME: PlaybookTheme = {
  colors: {
    primary: '#1E6B63',
    darkBase: '#0F1F1D',
    accent: '#C8A86E',
    light: '#F0ECE4',
    neutral: '#7A756D',
  },
  fonts: {
    heading: 'DM Sans',
    headingWeight: '700',
    body: 'DM Sans',
    bodyWeight: '400',
  },
  googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  cssVariables: {},
};

function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '0, 0, 0';
  return `${r}, ${g}, ${b}`;
}

function isValidHex(hex: string | undefined): boolean {
  if (!hex) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function buildGoogleFontsUrl(fonts: string[]): string {
  const uniqueFonts = Array.from(new Set(fonts.filter(Boolean)));
  if (uniqueFonts.length === 0) return DEFAULT_THEME.googleFontsUrl;

  const families = uniqueFonts.map(font =>
    `family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700`
  ).join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export function extractPlaybookTheme(
  colorPalette?: ColorPalette | null,
  typography?: Typography | null,
  designSystemColors?: DesignSystemColors | null
): PlaybookTheme {
  const theme: PlaybookTheme = { ...DEFAULT_THEME };

  // Extract colors — prefer design system colors, fall back to brand palette
  if (designSystemColors?.primary?.hex && isValidHex(designSystemColors.primary.hex)) {
    theme.colors = {
      primary: designSystemColors.primary.hex,
      darkBase: designSystemColors.dark_base?.hex || DEFAULT_THEME.colors.darkBase,
      accent: designSystemColors.accent?.hex || DEFAULT_THEME.colors.accent,
      light: designSystemColors.light?.hex || DEFAULT_THEME.colors.light,
      neutral: designSystemColors.neutral?.hex || DEFAULT_THEME.colors.neutral,
    };
  } else if (colorPalette?.primary && isValidHex(colorPalette.primary)) {
    theme.colors = {
      primary: colorPalette.primary,
      darkBase: isValidHex(colorPalette.dark_base) ? colorPalette.dark_base : DEFAULT_THEME.colors.darkBase,
      accent: isValidHex(colorPalette.accent) ? colorPalette.accent : DEFAULT_THEME.colors.accent,
      light: isValidHex(colorPalette.light) ? colorPalette.light : DEFAULT_THEME.colors.light,
      neutral: isValidHex(colorPalette.neutral) ? colorPalette.neutral : DEFAULT_THEME.colors.neutral,
    };
  }

  // Extract fonts
  if (typography?.heading_font) {
    theme.fonts = {
      heading: typography.heading_font,
      headingWeight: typography.heading_weight || '700',
      body: typography.body_font || typography.heading_font,
      bodyWeight: typography.body_weight || '400',
    };
  }

  // Build Google Fonts URL
  theme.googleFontsUrl = buildGoogleFontsUrl([theme.fonts.heading, theme.fonts.body]);

  // Build CSS variables
  theme.cssVariables = {
    '--playbook-primary': theme.colors.primary,
    '--playbook-primary-rgb': hexToRgb(theme.colors.primary),
    '--playbook-dark': theme.colors.darkBase,
    '--playbook-dark-rgb': hexToRgb(theme.colors.darkBase),
    '--playbook-accent': theme.colors.accent,
    '--playbook-accent-rgb': hexToRgb(theme.colors.accent),
    '--playbook-light': theme.colors.light,
    '--playbook-light-rgb': hexToRgb(theme.colors.light),
    '--playbook-neutral': theme.colors.neutral,
    '--playbook-neutral-rgb': hexToRgb(theme.colors.neutral),
    '--playbook-heading-font': `'${theme.fonts.heading}', sans-serif`,
    '--playbook-body-font': `'${theme.fonts.body}', sans-serif`,
  };

  return theme;
}
