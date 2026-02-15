import sharp from 'sharp';
import { CanvaClient } from './client';
import type { ColorPalette } from '@/lib/playbook/parse-brand-outputs';

interface BrandSyncOptions {
  accessToken: string;
  brandLogoUrl?: string;
  colorPalette?: ColorPalette;
}

interface BrandSyncResult {
  logoUploaded: boolean;
  swatchesUploaded: number;
  errors: string[];
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export async function generateColorSwatch(hex: string, label: string): Promise<Buffer> {
  const textColor = getLuminance(hex) > 0.5 ? '#000000' : '#ffffff';

  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${hex}"/>
      <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${textColor}">${hex.toUpperCase()}</text>
      <text x="200" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="${textColor}" opacity="0.8">${label}</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function syncBrandToCanva(options: BrandSyncOptions): Promise<BrandSyncResult> {
  const { accessToken, brandLogoUrl, colorPalette } = options;
  const client = new CanvaClient(accessToken);
  const result: BrandSyncResult = { logoUploaded: false, swatchesUploaded: 0, errors: [] };

  // Upload brand logo
  if (brandLogoUrl) {
    try {
      await client.uploadAssetByUrl({
        name: 'Brand Logo',
        url: brandLogoUrl,
        tags: ['brand', 'logo'],
      });
      result.logoUploaded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Logo upload failed: ${message}`);
      console.error('[canva-brand-sync] Logo upload failed:', error);
    }
  }

  // Generate and upload color swatches
  if (colorPalette) {
    const colorEntries: [string, string][] = [
      [colorPalette.primary, 'Primary'],
      [colorPalette.dark_base, 'Dark Base'],
      [colorPalette.accent, 'Accent'],
      [colorPalette.light, 'Light'],
      [colorPalette.neutral, 'Neutral'],
    ];

    for (const [hex, label] of colorEntries) {
      if (!hex || !hex.startsWith('#')) continue;

      try {
        const swatchBuffer = await generateColorSwatch(hex, label);
        await client.uploadAssetFromBuffer({
          name: `Brand Color - ${label} (${hex})`,
          buffer: swatchBuffer,
          mimeType: 'image/png',
          tags: ['brand', 'color-palette', label.toLowerCase().replace(/\s+/g, '-')],
        });
        result.swatchesUploaded++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`${label} swatch upload failed: ${message}`);
        console.error(`[canva-brand-sync] ${label} swatch upload failed:`, error);
      }
    }
  }

  return result;
}
