import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST — accept .md file, parse sections, return preview JSON.
 * Does NOT create a template — just parses for preview.
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

    const text = await file.text();
    const parsed = parseMarkdownTemplate(text);

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

interface ParsedTemplate {
  name: string;
  structure: string | null;
  psychology: string | null;
  when_to_use: string[];
  when_not_to_use: string[];
  example_content: string | null;
  prompt_instructions: string | null;
  description: string | null;
}

function parseMarkdownTemplate(markdown: string): ParsedTemplate {
  const result: ParsedTemplate = {
    name: '',
    structure: null,
    psychology: null,
    when_to_use: [],
    when_not_to_use: [],
    example_content: null,
    prompt_instructions: null,
    description: null,
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

  // Parse labeled sections
  const sectionMap: Record<string, keyof ParsedTemplate> = {
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

  let currentSection: keyof ParsedTemplate | null = null;
  let currentContent: string[] = [];

  const flushSection = () => {
    if (currentSection && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      if (currentSection === 'when_to_use' || currentSection === 'when_not_to_use') {
        // Parse bullet points
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
    // Check for section headings (## or ### or **Bold:** labels)
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

  // If no name was found, use filename hint
  if (!result.name) {
    result.name = 'Unnamed Template';
  }

  return result;
}
