import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getPhaseTemplate } from '@/config/phases';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { organizationId, phaseId, message } = await request.json();

    const supabase = createClient();

    // Verify user has access to this organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get organization info
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    // Get current phase
    const { data: phase } = await supabase
      .from('brand_phases')
      .select('*')
      .eq('id', phaseId)
      .single();

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // Get phase template
    const phaseTemplate = getPhaseTemplate(phase.phase_number);
    if (!phaseTemplate) {
      return NextResponse.json({ error: 'Phase template not found' }, { status: 404 });
    }

    // Get all locked outputs for context
    const { data: outputs } = await supabase
      .from('brand_outputs')
      .select('output_key, output_value')
      .eq('organization_id', organizationId)
      .eq('is_locked', true);

    const lockedOutputs = outputs?.reduce((acc, o) => {
      acc[o.output_key] = o.output_value;
      return acc;
    }, {} as Record<string, unknown>) || {};

    // Get conversation history
    const { data: conversation } = await supabase
      .from('brand_conversations')
      .select('messages')
      .eq('organization_id', organizationId)
      .eq('phase_id', phaseId)
      .single();

    const previousMessages = (conversation?.messages as Array<{ role: string; content: string }>) || [];

    // Build system prompt
    const systemPrompt = buildSystemPrompt(phaseTemplate, lockedOutputs, org?.name || 'Your Organization');

    // Prepare messages for Claude
    const claudeMessages = [
      ...previousMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Save conversation
    const newMessages = [
      ...previousMessages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
    ];

    if (conversation) {
      await supabase
        .from('brand_conversations')
        .update({
          messages: newMessages,
          tokens_used: (conversation as { tokens_used?: number }).tokens_used || 0 + response.usage.input_tokens + response.usage.output_tokens,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('phase_id', phaseId);
    } else {
      await supabase
        .from('brand_conversations')
        .insert({
          organization_id: organizationId,
          phase_id: phaseId,
          user_id: user.id,
          messages: newMessages,
          tokens_used: response.usage.input_tokens + response.usage.output_tokens,
        });
    }

    // Update phase status to in_progress if not_started
    if (phase.status === 'not_started') {
      await supabase
        .from('brand_phases')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', phaseId);
    }

    // Track AI usage
    await supabase
      .from('ai_usage')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        feature: 'brand_engine',
        model: 'claude-sonnet-4-20250514',
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      });

    // Parse outputs from response if YAML block is present
    const yamlOutputs = parseYamlFromResponse(assistantMessage, organizationId, phaseId);

    // Save outputs if found
    if (yamlOutputs.length > 0) {
      for (const output of yamlOutputs) {
        await supabase
          .from('brand_outputs')
          .upsert(output, { onConflict: 'organization_id,output_key' });
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      outputs: yamlOutputs.length > 0 ? yamlOutputs : undefined,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    });
  } catch (error) {
    console.error('Brand chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(
  phase: { number: string; name: string; instructions: string; questions: string[]; outputVariables: string[] },
  lockedOutputs: Record<string, unknown>,
  orgName: string
): string {
  return `You are a Brand Strategist guiding ${orgName} through the SkaleFlow™ Brand Engine.

## YOUR ROLE
- Guide the user through Phase ${phase.number}: ${phase.name}
- Ask questions from the phase framework
- Structure their raw answers into clear outputs
- Challenge vague or weak answers
- Confirm outputs before moving on

## CURRENT PHASE: ${phase.number} — ${phase.name}
${phase.instructions}

## QUESTIONS TO ASK
${phase.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## OUTPUT VARIABLES TO CAPTURE
${phase.outputVariables.map(v => `- ${v}`).join('\n')}

## PREVIOUSLY LOCKED OUTPUTS (Context)
${Object.keys(lockedOutputs).length > 0 ? JSON.stringify(lockedOutputs, null, 2) : 'None yet - this is a fresh start.'}

## RULES
1. Work through questions one at a time
2. Don't skip ahead to other phases
3. Use the user's exact language where possible, but structure it clearly
4. When all questions are answered, present the structured output as YAML
5. Ask the user to confirm or edit before locking
6. Be direct and friendly, not corporate
7. Reference previous outputs when relevant (e.g., use ICP pains when discussing messaging)

## OUTPUT FORMAT
When presenting final outputs for this phase, format as:
\`\`\`yaml
[variable_name]:
  [structured_content]
\`\`\`

Then ask: "Does this capture it correctly? Say 'lock it' to save, or tell me what to change."`;
}

function parseYamlFromResponse(
  response: string,
  organizationId: string,
  phaseId: string
): Array<{
  organization_id: string;
  phase_id: string;
  output_key: string;
  output_value: unknown;
  is_locked: boolean;
}> {
  const outputs: Array<{
    organization_id: string;
    phase_id: string;
    output_key: string;
    output_value: unknown;
    is_locked: boolean;
  }> = [];

  // Find YAML blocks
  const yamlMatch = response.match(/```yaml\n?([\s\S]*?)\n?```/);
  if (!yamlMatch) return outputs;

  const yamlContent = yamlMatch[1];

  // Simple YAML parsing for key-value pairs
  const lines = yamlContent.split('\n');
  let currentKey = '';
  let currentValue: string[] = [];
  let inArray = false;

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);

    if (keyMatch && !line.startsWith('  ')) {
      // Save previous key if exists
      if (currentKey) {
        outputs.push({
          organization_id: organizationId,
          phase_id: phaseId,
          output_key: currentKey,
          output_value: inArray ? currentValue : currentValue.join('\n').trim(),
          is_locked: false,
        });
      }

      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();

      if (value === '' || value === '|') {
        currentValue = [];
        inArray = false;
      } else if (value.startsWith('[')) {
        // Inline array
        try {
          currentValue = JSON.parse(value.replace(/'/g, '"'));
          inArray = true;
        } catch {
          currentValue = [value];
          inArray = false;
        }
      } else {
        currentValue = [value];
        inArray = false;
      }
    } else if (line.startsWith('  - ')) {
      // Array item
      currentValue.push(line.substring(4).trim());
      inArray = true;
    } else if (line.startsWith('  ') && currentKey) {
      // Continuation of value
      currentValue.push(line.trim());
    }
  }

  // Save last key
  if (currentKey) {
    outputs.push({
      organization_id: organizationId,
      phase_id: phaseId,
      output_key: currentKey,
      output_value: inArray ? currentValue : currentValue.join('\n').trim(),
      is_locked: false,
    });
  }

  return outputs;
}
