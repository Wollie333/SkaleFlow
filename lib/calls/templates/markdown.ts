/**
 * Convert a call template to/from Markdown format.
 * Field names match the database schema exactly for automatic mapping.
 */

export interface TemplatePhase {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  questions: string[];
  transitionTriggers: string[];
  aiInstructions: string;
}

export interface TemplateData {
  name: string;
  description: string;
  call_type: string;
  opening_script: string;
  closing_script: string;
  phases: TemplatePhase[];
  objection_bank: Array<{ objection: string; response: string }>;
}

const VALID_CALL_TYPES = ['discovery', 'sales', 'onboarding', 'meeting', 'follow_up', 'custom'];

/**
 * Generate a Markdown file from a template (or a blank scaffold).
 */
export function templateToMarkdown(template?: Partial<TemplateData>): string {
  const t = template || {};
  const lines: string[] = [];

  lines.push('# Call Template');
  lines.push('');
  lines.push('> Fill in each section below. The field names (in **bold**) are used to map your content');
  lines.push('> into SkaleFlow automatically. Do not rename the headers or field labels.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Metadata
  lines.push('## Metadata');
  lines.push('');
  lines.push(`**name:** ${t.name || 'My Custom Template'}`);
  lines.push(`**description:** ${t.description || 'A brief description of what this template is for.'}`);
  lines.push(`**call_type:** ${t.call_type || 'custom'}`);
  lines.push('');
  lines.push(`> Valid call_type values: ${VALID_CALL_TYPES.join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Opening script
  lines.push('## opening_script');
  lines.push('');
  lines.push(t.opening_script || 'Write your opening script here. Use [guest_name] as a placeholder for the attendee name.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Phases
  lines.push('## Phases');
  lines.push('');
  lines.push('> Add as many phases as you need. Each phase starts with `### Phase N:` followed by the phase name.');
  lines.push('');

  const phases = t.phases && t.phases.length > 0 ? t.phases : [
    {
      id: 'phase_1',
      name: 'Example Phase',
      description: 'Describe what happens in this phase.',
      durationMinutes: 5,
      questions: ['What question should you ask here?', 'What other question is important?'],
      transitionTriggers: ['trigger to move to next phase'],
      aiInstructions: 'Instructions for the AI copilot during this phase.',
    },
  ];

  phases.forEach((phase, idx) => {
    lines.push(`### Phase ${idx + 1}: ${phase.name}`);
    lines.push('');
    lines.push(`**description:** ${phase.description}`);
    lines.push(`**durationMinutes:** ${phase.durationMinutes}`);
    lines.push('');
    lines.push('**questions:**');
    if (phase.questions.length > 0) {
      phase.questions.forEach(q => lines.push(`- ${q}`));
    } else {
      lines.push('- (Add questions here)');
    }
    lines.push('');
    lines.push('**transitionTriggers:**');
    if (phase.transitionTriggers.length > 0) {
      phase.transitionTriggers.forEach(t => lines.push(`- ${t}`));
    } else {
      lines.push('- (Add triggers here)');
    }
    lines.push('');
    lines.push('**aiInstructions:**');
    lines.push(phase.aiInstructions || '(Instructions for the AI copilot during this phase.)');
    lines.push('');
  });

  lines.push('---');
  lines.push('');

  // Closing script
  lines.push('## closing_script');
  lines.push('');
  lines.push(t.closing_script || 'Write your closing script here. Use [guest_name] and [key_points] as placeholders.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Objection bank
  lines.push('## objection_bank');
  lines.push('');
  lines.push('> Add objection/response pairs. Each starts with `### Objection N`.');
  lines.push('');

  const objections = t.objection_bank && t.objection_bank.length > 0 ? t.objection_bank : [
    { objection: 'Example: It\'s too expensive', response: 'Example: Let\'s look at the ROI based on what you shared...' },
  ];

  objections.forEach((obj, idx) => {
    lines.push(`### Objection ${idx + 1}`);
    lines.push('');
    lines.push(`**objection:** ${obj.objection}`);
    lines.push(`**response:** ${obj.response}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Parse a Markdown file back into template data.
 */
export function markdownToTemplate(md: string): TemplateData {
  const result: TemplateData = {
    name: '',
    description: '',
    call_type: 'custom',
    opening_script: '',
    closing_script: '',
    phases: [],
    objection_bank: [],
  };

  // Extract metadata fields
  result.name = extractField(md, 'name') || 'Untitled Template';
  result.description = extractField(md, 'description') || '';
  const callType = extractField(md, 'call_type') || 'custom';
  result.call_type = VALID_CALL_TYPES.includes(callType) ? callType : 'custom';

  // Extract opening_script section
  result.opening_script = extractSection(md, 'opening_script') || '';

  // Extract closing_script section
  result.closing_script = extractSection(md, 'closing_script') || '';

  // Extract phases
  const phasesSection = extractSection(md, 'Phases');
  if (phasesSection) {
    const phaseBlocks = phasesSection.split(/^### Phase \d+:/m).filter(b => b.trim());
    phaseBlocks.forEach((block, idx) => {
      const nameMatch = block.match(/^([^\n]+)/);
      const phaseName = nameMatch ? nameMatch[1].trim() : `Phase ${idx + 1}`;

      const phase: TemplatePhase = {
        id: `phase_${idx + 1}_${Date.now()}`,
        name: phaseName,
        description: extractField(block, 'description') || '',
        durationMinutes: parseInt(extractField(block, 'durationMinutes') || '5') || 5,
        questions: extractList(block, 'questions'),
        transitionTriggers: extractList(block, 'transitionTriggers'),
        aiInstructions: extractMultilineField(block, 'aiInstructions') || '',
      };

      result.phases.push(phase);
    });
  }

  // Extract objection bank
  const objectionSection = extractSection(md, 'objection_bank');
  if (objectionSection) {
    const objBlocks = objectionSection.split(/^### Objection \d+/m).filter(b => b.trim());
    objBlocks.forEach(block => {
      const objection = extractField(block, 'objection');
      const response = extractField(block, 'response');
      if (objection && response) {
        result.objection_bank.push({ objection, response });
      }
    });
  }

  return result;
}

// --- Helpers ---

function extractField(text: string, field: string): string {
  const regex = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+?)$`, 'm');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractMultilineField(text: string, field: string): string {
  const regex = new RegExp(`\\*\\*${field}:\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n---|\\n###|$)`);
  const match = text.match(regex);
  if (match) return match[1].trim();
  // Fallback: single-line after the label
  return extractField(text, field);
}

function extractList(text: string, field: string): string[] {
  const regex = new RegExp(`\\*\\*${field}:\\*\\*\\s*\\n((?:- .+\\n?)*)`, 'm');
  const match = text.match(regex);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(line => line && !line.startsWith('('));
}

function extractSection(text: string, heading: string): string {
  const regex = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'm');
  const match = text.match(regex);
  if (!match) return '';
  // Strip blockquote lines (instructions)
  return match[1]
    .split('\n')
    .filter(line => !line.startsWith('>'))
    .join('\n')
    .trim();
}
