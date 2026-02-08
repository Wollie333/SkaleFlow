import type { Json } from '@/types/database';

/**
 * Parse a YAML-like string into key-value pairs for preview display.
 * Handles multi-line values, arrays (- items), and block scalars (|, |-).
 */
export function parseYamlPreview(yaml: string): Array<{ key: string; value: string }> {
  const pairs: Array<{ key: string; value: string }> = [];
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);

    if (keyMatch && !line.startsWith('  ')) {
      if (currentKey) {
        pairs.push({ key: currentKey, value: currentLines.join('\n').trim() });
      }
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value === '' || value === '|' || value === '|-') {
        currentLines = [];
      } else {
        currentLines = [value];
      }
    } else if (currentKey) {
      const trimmed = line.startsWith('  - ') ? line.substring(4).trim() : line.trim();
      if (trimmed) {
        currentLines.push(trimmed);
      }
    }
  }

  if (currentKey) {
    pairs.push({ key: currentKey, value: currentLines.join('\n').trim() });
  }

  return pairs;
}

/**
 * Convert an output key like "brand_purpose" to "Brand Purpose".
 */
export function formatOutputKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format bytes to a human-readable file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Render a brand output value (string, array, or object) as a React-friendly node.
 * Returns a string representation for use in non-React contexts;
 * for JSX rendering, use the component-level formatOutputValue instead.
 */
export function formatOutputValueText(value: Json): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
  return String(value);
}
