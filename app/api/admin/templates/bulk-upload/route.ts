import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ParsedTemplate {
  name: string;
  template_key: string;
  structure: string | null;
  psychology: string | null;
  when_to_use: string[];
  when_not_to_use: string[];
  example_content: string | null;
  prompt_instructions: string | null;
  description: string | null;
  markdown_source: string;
}

const SECTION_MAP: Record<string, keyof Omit<ParsedTemplate, 'name' | 'template_key' | 'markdown_source'>> = {
  'structure': 'structure',
  'flow': 'structure',
  'template flow': 'structure',
  'psychology': 'psychology',
  'why it works': 'psychology',
  'when to use': 'when_to_use',
  'best for': 'when_to_use',
  'when not to use': 'when_not_to_use',
  'avoid when': 'when_not_to_use',
  'example': 'example_content',
  'example content': 'example_content',
  'sample': 'example_content',
  'prompt instructions': 'prompt_instructions',
  'ai instructions': 'prompt_instructions',
  'prompt': 'prompt_instructions',
  'description': 'description',
  'overview': 'description',
};

function generateTemplateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

function parseOneTemplate(markdown: string): Omit<ParsedTemplate, 'template_key'> {
  const result: Omit<ParsedTemplate, 'template_key'> = {
    name: '',
    structure: null,
    psychology: null,
    when_to_use: [],
    when_not_to_use: [],
    example_content: null,
    prompt_instructions: null,
    description: null,
    markdown_source: markdown,
  };

  const lines = markdown.split('\n');

  // Extract name from first H1 heading in this chunk
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)/);
    if (h1Match) {
      result.name = h1Match[1].trim();
      break;
    }
  }

  if (!result.name) {
    // Fallback: first H2/H3
    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headingMatch) {
        result.name = headingMatch[1].trim();
        break;
      }
    }
  }

  if (!result.name) {
    result.name = 'Unnamed Template';
  }

  // Parse sections
  type SectionKey = keyof Omit<ParsedTemplate, 'name' | 'template_key' | 'markdown_source'>;
  let currentSection: SectionKey | null = null;
  let currentContent: string[] = [];

  const flushSection = () => {
    if (currentSection && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (currentSection === 'when_to_use' || currentSection === 'when_not_to_use') {
        const items = content
          .split('\n')
          .map(l => l.replace(/^[-*]\s*/, '').trim())
          .filter(Boolean);
        result[currentSection] = items;
      } else {
        (result[currentSection] as string | null) = content;
      }
    }
    currentContent = [];
  };

  for (const line of lines) {
    // Skip the H1 line (it's the name, not a section)
    if (line.match(/^#\s+/)) continue;

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
      currentSection = SECTION_MAP[sectionName] || null;
      if (remainingContent && currentSection) {
        currentContent.push(remainingContent);
      }
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  flushSection();

  return result;
}

function splitByH1(markdown: string): string[] {
  const lines = markdown.split('\n');
  const chunks: string[] = [];
  let current: string[] = [];
  let foundFirstH1 = false;

  for (const line of lines) {
    if (line.match(/^#\s+/)) {
      if (foundFirstH1 && current.length > 0) {
        chunks.push(current.join('\n'));
        current = [];
      }
      foundFirstH1 = true;
      current.push(line);
    } else {
      if (foundFirstH1) {
        current.push(line);
      }
      // Content before first H1 is skipped
    }
  }

  if (current.length > 0) {
    chunks.push(current.join('\n'));
  }

  return chunks;
}

/**
 * POST — accept .md file, split by H1, parse each template, return preview JSON.
 * Does NOT create templates — just parses for preview.
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.md')) {
      return NextResponse.json({ error: 'Only .md files are supported' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const text = await file.text();
    const chunks = splitByH1(text);

    if (chunks.length === 0) {
      // No H1 headings — treat the whole file as a single template
      const parsed = parseOneTemplate(text);
      const key = generateTemplateKey(parsed.name);
      return NextResponse.json({
        success: true,
        templates: [{ ...parsed, template_key: key }],
      });
    }

    // Fetch existing template keys for dedup
    const { data: existingTemplates } = await supabase
      .from('content_templates')
      .select('template_key');

    const existingKeys = new Set(
      (existingTemplates || []).map((t: { template_key: string }) => t.template_key)
    );

    const usedKeys = new Set<string>();
    const templates: ParsedTemplate[] = [];

    for (const chunk of chunks) {
      const parsed = parseOneTemplate(chunk);

      // Generate unique key
      let baseKey = generateTemplateKey(parsed.name);
      let key = baseKey;
      let suffix = 2;
      while (existingKeys.has(key) || usedKeys.has(key)) {
        key = `${baseKey}_${suffix}`;
        suffix++;
      }
      usedKeys.add(key);

      templates.push({ ...parsed, template_key: key });
    }

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Error parsing bulk template upload:', error);
    return NextResponse.json({ error: 'Failed to parse templates' }, { status: 500 });
  }
}
