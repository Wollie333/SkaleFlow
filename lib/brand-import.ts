// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');
import { PHASE_TEMPLATES } from '@/config/phases';

/**
 * Extract text content from a PDF or Markdown file buffer.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const parser = new PDFParse(new Uint8Array(buffer));
    const data = await parser.getText();
    return data.text;
  }

  // .md files — just decode as UTF-8
  return buffer.toString('utf-8');
}

/**
 * Batch groupings for full import mode.
 * Each batch is processed in a single Claude call.
 */
export const PHASE_BATCHES: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['10'],
];

/**
 * Maps every output_key → its phase number (from PHASE_TEMPLATES).
 */
export function buildOutputKeyToPhaseMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [phaseNum, template] of Object.entries(PHASE_TEMPLATES)) {
    for (const key of template.outputVariables) {
      map[key] = phaseNum;
    }
  }
  return map;
}

/**
 * Returns all output variable keys for the given phase numbers,
 * along with descriptions derived from the phase template.
 */
export function getOutputKeysForPhases(
  phaseNumbers: string[]
): Array<{ key: string; phaseNumber: string; phaseName: string; description: string }> {
  const result: Array<{ key: string; phaseNumber: string; phaseName: string; description: string }> = [];

  for (const num of phaseNumbers) {
    const template = PHASE_TEMPLATES[num];
    if (!template) continue;

    for (const key of template.outputVariables) {
      result.push({
        key,
        phaseNumber: num,
        phaseName: template.name,
        description: `Phase ${num} (${template.name})`,
      });
    }
  }

  return result;
}

/**
 * Build the Claude system prompt for extracting brand variables from a document.
 */
export function buildExtractionPrompt(
  outputKeys: Array<{ key: string; phaseNumber: string; phaseName: string; description: string }>
): string {
  const variablesList = outputKeys
    .map((v) => `- "${v.key}" — ${v.description}`)
    .join('\n');

  return `You are a brand strategy analyst. Extract structured data from the provided brand document.

EXTRACT these variables (return JSON only):
${variablesList}

RULES:
1. Return ONLY valid JSON — no code fences, no markdown, no explanation
2. Values should be: strings for single items, arrays of strings for lists
3. Set to null if the document has no relevant content for that variable
4. Preserve the document's original language and terminology
5. Be thorough — extract as much relevant content as possible for each variable
6. For list-type variables (values, characteristics, pains, etc.), return arrays
7. For descriptive variables (purpose, vision, statements), return strings`;
}

/**
 * Parse a JSON response from Claude, handling common issues
 * like code fences and extra text.
 */
export function parseJsonResponse(
  text: string,
  expectedKeys: string[]
): Record<string, unknown> | null {
  let cleaned = text.trim();

  // Strip code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try to find JSON object boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Maximum file size: 10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/x-markdown',
  'text/plain', // .md files sometimes come through as text/plain
];

/** Allowed file extensions */
export const ALLOWED_EXTENSIONS = ['.pdf', '.md'];
