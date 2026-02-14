import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST — accept .md content (file upload OR pasted text), parse front matter + sections.
 * Does NOT create a template — just parses for preview.
 *
 * Accepts:
 *  - FormData with 'file' field (.md file)
 *  - JSON body with 'markdown' field (pasted text)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let text = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // File upload path
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (!file.name.endsWith('.md')) {
        return NextResponse.json({ error: 'Only .md files are supported' }, { status: 400 });
      }

      text = await file.text();
    } else {
      // JSON body path (pasted markdown)
      const body = await request.json();
      text = body.markdown;

      if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'No markdown content provided' }, { status: 400 });
      }
    }

    const { metadata, content: cleanedContent } = parseFrontMatter(text);
    const parsed = parseMarkdownTemplate(cleanedContent, metadata);

    return NextResponse.json({
      success: true,
      parsed,
      rawMarkdown: text,
    });
  } catch (error) {
    console.error('Error parsing template upload:', error);
    return NextResponse.json({ error: 'Failed to parse template' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FrontMatterMetadata {
  category?: string;
  content_type?: string;
  format_category?: string;
  tier?: string;
  funnel_stages?: string[];
  storybrand_stages?: Array<{ stage: string; is_primary: boolean }>;
  platforms?: string[];
  word_count?: string;
}

export interface ParsedTemplateWithMeta {
  // Content fields (from section parsing)
  name: string;
  structure: string | null;
  psychology: string | null;
  when_to_use: string[];
  when_not_to_use: string[];
  example_content: string | null;
  prompt_instructions: string | null;
  description: string | null;
  // Standardised atomic sections
  hook_rules: string | null;
  body_rules: string | null;
  cta_rules: string | null;
  tone_voice: string | null;
  formatting_rules: string | null;
  // Metadata fields (from front matter)
  category: string | null;
  content_type: string | null;
  format_category: string | null;
  tier: string | null;
  funnel_stages: string[];
  storybrand_stages: Array<{ stage: string; is_primary: boolean }>;
  platforms: string[];
  word_count: string | null;
  has_front_matter: boolean;
  // Validation
  missing_sections: string[];
}

// ---------------------------------------------------------------------------
// YAML Front Matter Parser
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = ['video_script', 'hook', 'cta', 'social_framework', 'seo_content', 'email_outreach', 'web_copy'];
const VALID_CONTENT_TYPES = ['post', 'script', 'hook', 'cta'];
const VALID_FORMAT_CATEGORIES = ['short', 'medium', 'long', 'carousel', 'static'];
const VALID_TIERS = ['core_rotation', 'high_impact', 'strategic'];
const VALID_FUNNEL_STAGES = ['awareness', 'consideration', 'conversion'];
const VALID_STORYBRAND_STAGES = ['character', 'external_problem', 'internal_problem', 'philosophical_problem', 'guide', 'plan', 'call_to_action', 'failure', 'success'];

function parseFrontMatter(markdown: string): { metadata: FrontMatterMetadata; content: string } {
  const metadata: FrontMatterMetadata = {};

  // Check for front matter between --- fences
  const fmMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { metadata, content: markdown };
  }

  const fmBlock = fmMatch[1];
  const content = fmMatch[2];

  // Parse simple YAML key: value pairs (one level only, ignoring comments)
  const lines = fmBlock.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.substring(0, colonIdx).trim().toLowerCase();
    const value = trimmed.substring(colonIdx + 1).trim();

    if (!value) continue;

    switch (key) {
      case 'category': {
        const v = value.toLowerCase();
        if (VALID_CATEGORIES.includes(v)) {
          metadata.category = v;
        }
        break;
      }
      case 'content_type': {
        const v = value.toLowerCase();
        if (VALID_CONTENT_TYPES.includes(v)) {
          metadata.content_type = v;
        }
        break;
      }
      case 'format_category': {
        const v = value.toLowerCase();
        if (VALID_FORMAT_CATEGORIES.includes(v)) {
          metadata.format_category = v;
        }
        break;
      }
      case 'tier': {
        const v = value.toLowerCase();
        if (VALID_TIERS.includes(v)) {
          metadata.tier = v;
        }
        break;
      }
      case 'funnel_stages': {
        const stages = value.split(',').map(s => s.trim().toLowerCase()).filter(s => VALID_FUNNEL_STAGES.includes(s));
        if (stages.length > 0) {
          metadata.funnel_stages = stages;
        }
        break;
      }
      case 'storybrand_stages': {
        const parsed = value.split(',').map(s => {
          const raw = s.trim().toLowerCase();
          const isPrimary = raw.includes('(primary)');
          const stageName = raw.replace('(primary)', '').trim();
          return { stage: stageName, is_primary: isPrimary };
        }).filter(s => VALID_STORYBRAND_STAGES.includes(s.stage));
        if (parsed.length > 0) {
          metadata.storybrand_stages = parsed;
        }
        break;
      }
      case 'platforms': {
        const platforms = value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (platforms.length > 0) {
          metadata.platforms = platforms;
        }
        break;
      }
      case 'word_count': {
        metadata.word_count = value;
        break;
      }
    }
  }

  return { metadata, content };
}

// ---------------------------------------------------------------------------
// Markdown Content Parser (enhanced from original)
// ---------------------------------------------------------------------------

function parseMarkdownTemplate(markdown: string, metadata: FrontMatterMetadata): ParsedTemplateWithMeta {
  const result: ParsedTemplateWithMeta = {
    name: '',
    structure: null,
    psychology: null,
    when_to_use: [],
    when_not_to_use: [],
    example_content: null,
    prompt_instructions: null,
    description: null,
    // Standardised atomic sections
    hook_rules: null,
    body_rules: null,
    cta_rules: null,
    tone_voice: null,
    formatting_rules: null,
    // Metadata from front matter
    category: metadata.category || null,
    content_type: metadata.content_type || null,
    format_category: metadata.format_category || null,
    tier: metadata.tier || null,
    funnel_stages: metadata.funnel_stages || [],
    storybrand_stages: metadata.storybrand_stages || [],
    platforms: metadata.platforms || [],
    word_count: metadata.word_count || null,
    has_front_matter: !!(metadata.category || metadata.content_type || metadata.tier),
    missing_sections: [],
  };

  const lines = markdown.split('\n');

  // Extract name from first heading (H1, H2, or H3)
  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      result.name = headingMatch[1].trim();
      break;
    }
  }

  // Parse labeled sections — includes both legacy and standardised section names
  type ContentKey = 'structure' | 'psychology' | 'when_to_use' | 'when_not_to_use' | 'example_content' | 'prompt_instructions' | 'description' | 'hook_rules' | 'body_rules' | 'cta_rules' | 'tone_voice' | 'formatting_rules';

  const sectionMap: Record<string, ContentKey> = {
    // Legacy + standardised: Structure
    'structure': 'structure',
    'flow': 'structure',
    'template flow': 'structure',
    'the 5-part structure': 'structure',
    'framework structure': 'structure',
    // Legacy + standardised: Psychology
    'psychology': 'psychology',
    'why it works': 'psychology',
    'why this works': 'psychology',
    // Legacy + standardised: When to use / not use
    'when to use': 'when_to_use',
    'best for': 'when_to_use',
    'ideal for': 'when_to_use',
    'when not to use': 'when_not_to_use',
    'avoid when': 'when_not_to_use',
    'not ideal for': 'when_not_to_use',
    // Legacy + standardised: Examples
    'example': 'example_content',
    'example content': 'example_content',
    'sample': 'example_content',
    'sample output': 'example_content',
    // Legacy + standardised: Prompt instructions
    'prompt instructions': 'prompt_instructions',
    'ai instructions': 'prompt_instructions',
    'prompt': 'prompt_instructions',
    'ai prompt': 'prompt_instructions',
    'generation instructions': 'prompt_instructions',
    // Legacy + standardised: Description
    'description': 'description',
    'overview': 'description',
    'framework overview': 'description',
    // ── NEW: Standardised atomic sections ──
    'hook rules': 'hook_rules',
    'hook': 'hook_rules',
    'opening rules': 'hook_rules',
    'attention grabber': 'hook_rules',
    'body rules': 'body_rules',
    'body': 'body_rules',
    'main content rules': 'body_rules',
    'content rules': 'body_rules',
    'cta rules': 'cta_rules',
    'call to action rules': 'cta_rules',
    'closing rules': 'cta_rules',
    'close': 'cta_rules',
    'tone & voice': 'tone_voice',
    'tone and voice': 'tone_voice',
    'tone': 'tone_voice',
    'voice': 'tone_voice',
    'writing style': 'tone_voice',
    'formatting rules': 'formatting_rules',
    'formatting': 'formatting_rules',
    'format rules': 'formatting_rules',
    'formatting notes': 'formatting_rules',
    'platform formatting': 'formatting_rules',
  };

  let currentSection: ContentKey | null = null;
  let currentContent: string[] = [];

  const flushSection = () => {
    if (currentSection && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (currentSection === 'when_to_use' || currentSection === 'when_not_to_use') {
        const items = content
          .split('\n')
          .map(l => l.replace(/^[-*]\s*/, '').replace(/^\[[ x]\]\s*/, '').trim())
          .filter(Boolean);
        result[currentSection] = items;
      } else {
        (result[currentSection] as string | null) = content;
      }
    }
    currentContent = [];
  };

  for (const line of lines) {
    // Check for section headings (## or ### or #### or **Bold:** labels)
    const headingMatch = line.match(/^#{2,4}\s+(.+)/);
    const boldLabelMatch = line.match(/^\*\*(.+?)[:]*\*\*\s*(.*)/);

    let sectionName: string | null = null;
    let remainingContent: string | null = null;

    if (headingMatch) {
      sectionName = headingMatch[1].trim().toLowerCase();
    } else if (boldLabelMatch) {
      sectionName = boldLabelMatch[1].trim().toLowerCase();
      remainingContent = boldLabelMatch[2]?.trim() || null;
    }

    if (sectionName) {
      flushSection();
      currentSection = sectionMap[sectionName] || null;
      if (remainingContent && currentSection) {
        currentContent.push(remainingContent);
      }
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  flushSection();

  // If no name was found, use fallback
  if (!result.name) {
    result.name = 'Unnamed Template';
  }

  // Validate standardised sections — report what's missing
  const requiredSections: Array<{ key: keyof ParsedTemplateWithMeta; label: string }> = [
    { key: 'description', label: 'Description' },
    { key: 'structure', label: 'Structure' },
    { key: 'hook_rules', label: 'Hook Rules' },
    { key: 'body_rules', label: 'Body Rules' },
    { key: 'cta_rules', label: 'CTA Rules' },
    { key: 'tone_voice', label: 'Tone & Voice' },
    { key: 'formatting_rules', label: 'Formatting Rules' },
    { key: 'psychology', label: 'Psychology' },
  ];

  result.missing_sections = requiredSections
    .filter(s => !result[s.key])
    .map(s => s.label);

  return result;
}
