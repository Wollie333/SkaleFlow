import type { GeneratedItem, PlacementEntry } from '@/components/content-machine/types';
import { getPlacementLabel } from '@/config/placement-types';
import type { PlacementType, SocialPlatform } from '@/types/database';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

interface ExportEntry {
  platform: SocialPlatform;
  placement: PlacementType;
  item: GeneratedItem;
}

function buildEntries(
  placements: PlacementEntry[],
  itemMap: Record<string, GeneratedItem>
): ExportEntry[] {
  const entries: ExportEntry[] = [];
  for (const { platform, placement } of placements) {
    const item = itemMap[placement];
    if (item) {
      entries.push({ platform, placement, item });
    }
  }
  return entries;
}

export function exportAsText(
  placements: PlacementEntry[],
  itemMap: Record<string, GeneratedItem>
): string {
  const entries = buildEntries(placements, itemMap);
  if (entries.length === 0) return '';

  return entries
    .map(({ platform, placement, item }, i) => {
      const lines = [
        `--- Post ${i + 1}: ${PLATFORM_LABELS[platform]} · ${getPlacementLabel(placement)} ---`,
      ];
      if (item.topic) lines.push(`Topic: ${item.topic}`);
      if (item.caption) lines.push(`\n${item.caption}`);
      if (item.hashtags && item.hashtags.length > 0) {
        lines.push(`\n${item.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`);
      }
      if (item.funnel_stage) lines.push(`\nFunnel: ${item.funnel_stage}`);
      if (item.storybrand_stage) lines.push(`StoryBrand: ${item.storybrand_stage}`);
      if (item.format) lines.push(`Format: ${item.format.replace(/_/g, ' ')}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function exportAsCSV(
  placements: PlacementEntry[],
  itemMap: Record<string, GeneratedItem>
): string {
  const entries = buildEntries(placements, itemMap);
  const headers = [
    'Platform',
    'Placement',
    'Topic',
    'Caption',
    'Hashtags',
    'Funnel Stage',
    'StoryBrand Stage',
    'Format',
    'Status',
  ];

  const rows = entries.map(({ platform, placement, item }) => [
    PLATFORM_LABELS[platform],
    getPlacementLabel(placement),
    item.topic || '',
    item.caption || '',
    (item.hashtags || []).join(' '),
    item.funnel_stage || '',
    item.storybrand_stage || '',
    (item.format || '').replace(/_/g, ' '),
    item.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          const escaped = String(cell).replace(/"/g, '""');
          return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

export async function copyToClipboard(
  placements: PlacementEntry[],
  itemMap: Record<string, GeneratedItem>
): Promise<boolean> {
  const text = exportAsText(placements, itemMap);
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
