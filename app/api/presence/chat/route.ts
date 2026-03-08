import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPresencePhaseByNumber, getOutputVariablesForQuestion } from '@/config/presence-phases';
import { getPresenceAgentForQuestion, formatPresenceAgentForPrompt } from '@/config/presence-agents';
import { readBrandOutputsForPresence, formatBrandContextForPresence } from '@/lib/presence/brand-variable-reader';
import { logger } from '@/lib/logger';
import type { Json } from '@/types/database';
import { resolveModel, requireCredits, calculateCreditCost, deductCredits, getProviderAdapterForUser } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai/server';
import { hasPermission } from '@/lib/permissions';
import { checkTeamCredits, deductTeamCredits } from '@/lib/team-credits';
import { isAiBetaEnabled, getUserApiKey } from '@/lib/ai/user-keys';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    let organizationId: string;
    let phaseId: string;
    let message: string;
    let modelOverride: string | null = null;
    let files: File[] = [];
    let persistenceWarning = false;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      organizationId = formData.get('organizationId') as string;
      phaseId = formData.get('phaseId') as string;
      message = (formData.get('message') as string) || '';
      modelOverride = formData.get('modelOverride') as string | null;
      files = formData.getAll('files') as File[];
    } else {
      const body = await request.json();
      organizationId = body.organizationId;
      phaseId = body.phaseId;
      message = body.message;
      modelOverride = body.modelOverride || null;
    }

    const supabase = await createClient();
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

    logger.info('Presence chat request received', { organizationId, phaseId, userId: user.id, fileCount: files.length });

    // Get organization info
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    // Get current phase
    const { data: phase } = await supabase
      .from('presence_phases')
      .select('*')
      .eq('id', phaseId)
      .single();

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    const phaseTemplate = getPresencePhaseByNumber(phase.phase_number);
    if (!phaseTemplate) {
      return NextResponse.json({ error: 'Phase template not found' }, { status: 404 });
    }

    // Get ALL presence outputs for context
    const { data: allOutputs } = await supabase
      .from('presence_outputs')
      .select('output_key, output_value, is_locked, phase_id')
      .eq('organization_id', organizationId);

    const lockedOutputs: Record<string, unknown> = {};
    const draftOutputs: Record<string, unknown> = {};
    const currentPhaseOutputs: Record<string, unknown> = {};

    for (const o of allOutputs || []) {
      if (o.is_locked) {
        lockedOutputs[o.output_key] = o.output_value;
      }
      if (o.phase_id === phaseId && !o.is_locked) {
        draftOutputs[o.output_key] = o.output_value;
      }
      if (o.phase_id === phaseId) {
        currentPhaseOutputs[o.output_key] = o.output_value;
      }
    }

    // Read Brand Engine outputs for context
    const brandOutputs = await readBrandOutputsForPresence(organizationId);
    const brandContext = formatBrandContextForPresence(brandOutputs, phase.platform_key || undefined);

    // Get conversation history
    const { data: conversation } = await supabase
      .from('presence_conversations')
      .select('messages, tokens_used, credits_used')
      .eq('organization_id', organizationId)
      .eq('phase_id', phaseId)
      .single();

    const allPreviousMessages = (conversation?.messages as Array<{ role: string; content: string }>) || [];
    const MAX_HISTORY = 10;
    const previousMessages = allPreviousMessages.length > MAX_HISTORY
      ? allPreviousMessages.slice(-MAX_HISTORY)
      : allPreviousMessages;

    // Build system prompt
    const currentQuestionIndex = (phase as Record<string, unknown>).current_question_index as number ?? 0;
    const agent = getPresenceAgentForQuestion(phase.phase_number, currentQuestionIndex);
    const agentBlock = formatPresenceAgentForPrompt(agent);

    const currentOutputKeys = getOutputVariablesForQuestion(phase.phase_number, currentQuestionIndex);
    const systemPrompt = buildSystemPrompt(
      phaseTemplate,
      lockedOutputs,
      draftOutputs,
      currentPhaseOutputs,
      brandContext,
      org?.name || 'Your Organization',
      currentQuestionIndex,
      agentBlock,
      currentOutputKeys,
    );

    // Build message content (with files if attached)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messageContent: string | any[];

    if (files.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentBlocks: any[] = [];
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.byteLength < 100 || buffer.byteLength > 20 * 1024 * 1024) continue;
        const base64 = buffer.toString('base64');
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedImageTypes.includes(file.type)) {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
          });
        }
      }
      contentBlocks.push({ type: 'text', text: message || 'Please analyze the attached file(s).' });
      messageContent = contentBlocks;
    } else {
      messageContent = message;
    }

    // Resolve AI model
    const resolvedModel = await resolveModel(organizationId, 'brand_chat' as AIFeature, modelOverride);
    const useDirectClaude = resolvedModel.provider === 'anthropic' && files.length > 0;

    // Check for user API key
    let usingUserKey = false;
    let userAnthropicClient = anthropic;
    if (await isAiBetaEnabled(user.id)) {
      const userKey = await getUserApiKey(user.id, resolvedModel.provider);
      if (userKey) {
        usingUserKey = true;
        if (resolvedModel.provider === 'anthropic') {
          userAnthropicClient = new Anthropic({ apiKey: userKey });
        }
      }
    }

    // Pre-flight credit check
    if (!usingUserKey) {
      const creditResponse = await requireCredits(organizationId, resolvedModel.id, 2000, 1000, user.id);
      if (creditResponse) return creditResponse;
    }

    let assistantMessage: string;
    let inputTokens: number;
    let outputTokens: number;

    try {
      if (useDirectClaude) {
        const claudeMessages = [
          ...previousMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user' as const, content: messageContent },
        ];

        const response = await userAnthropicClient.messages.create({
          model: resolvedModel.modelId,
          max_tokens: 4096,
          system: systemPrompt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: claudeMessages as any,
        });

        assistantMessage = response.content[0]?.type === 'text' ? response.content[0].text : '';
        inputTokens = response.usage.input_tokens;
        outputTokens = response.usage.output_tokens;
      } else {
        const { adapter } = await getProviderAdapterForUser(resolvedModel.provider, user.id);
        const textMessages = [
          ...previousMessages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
          { role: 'user' as const, content: typeof messageContent === 'string' ? messageContent : message },
        ];

        const response = await adapter.complete({
          messages: textMessages,
          systemPrompt,
          maxTokens: 4096,
        });

        assistantMessage = response.text;
        inputTokens = response.inputTokens;
        outputTokens = response.outputTokens;
      }
    } catch (aiError) {
      const aiMsg = aiError instanceof Error ? aiError.message : String(aiError);
      logger.error('Presence AI call failed', { provider: resolvedModel.provider, error: aiMsg });
      return NextResponse.json({ error: `AI call failed: ${aiMsg}` }, { status: 502 });
    }

    if (!assistantMessage) {
      return NextResponse.json({ error: 'AI returned an empty response.' }, { status: 502 });
    }

    const requestTokens = inputTokens + outputTokens;

    // Store conversation
    const fileNames = files.map(f => f.name);
    const storedUserContent = files.length > 0
      ? `${message}${message ? '\n\n' : ''}[Attached files: ${fileNames.join(', ')}]`
      : message;

    const attachmentMeta = files.length > 0
      ? files.map(f => ({ name: f.name, type: f.type, size: f.size }))
      : undefined;

    const newMessages = [
      ...allPreviousMessages,
      {
        role: 'user',
        content: storedUserContent,
        timestamp: new Date().toISOString(),
        ...(attachmentMeta ? { attachments: attachmentMeta } : {}),
      },
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
    ];

    const creditsForThisMessage = usingUserKey ? 0 : calculateCreditCost(resolvedModel.id, inputTokens, outputTokens);
    let newCreditTotal = 0;

    if (conversation) {
      const previousTokens = conversation.tokens_used ?? 0;
      newCreditTotal = (conversation.credits_used ?? 0) + creditsForThisMessage;

      const { error: updateError } = await supabase
        .from('presence_conversations')
        .update({
          messages: newMessages,
          tokens_used: previousTokens + requestTokens,
          credits_used: newCreditTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('phase_id', phaseId);

      if (updateError) {
        logger.error('Failed to update presence conversation', { error: updateError.message });
        persistenceWarning = true;
      }
    } else {
      newCreditTotal = creditsForThisMessage;

      const { error: insertError } = await supabase
        .from('presence_conversations')
        .insert({
          organization_id: organizationId,
          phase_id: phaseId,
          user_id: user.id,
          messages: newMessages,
          tokens_used: requestTokens,
          credits_used: creditsForThisMessage,
        });

      if (insertError) {
        logger.error('Failed to insert presence conversation', { error: insertError.message });
        persistenceWarning = true;
      }
    }

    // Update phase status to in_progress if not_started
    if (phase.status === 'not_started') {
      await supabase
        .from('presence_phases')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', phaseId);
    }

    // Track AI usage
    const { data: usageRow } = await supabase
      .from('ai_usage')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        feature: 'presence_engine',
        model: resolvedModel.modelId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        credits_charged: creditsForThisMessage,
        provider: resolvedModel.provider,
        is_free_model: resolvedModel.isFree,
      })
      .select('id')
      .single();

    // Deduct credits
    if (creditsForThisMessage > 0) {
      await deductTeamCredits(
        organizationId,
        user.id,
        'presence_engine',
        creditsForThisMessage,
        `Presence chat — ${resolvedModel.name}`,
        usageRow?.id || null,
      );
    }

    // Parse YAML outputs from response
    const allPhaseOutputKeys = new Set(phaseTemplate.outputVariables);
    let yamlOutputs: ReturnType<typeof parseYamlFromResponse> = [];
    try {
      yamlOutputs = parseYamlFromResponse(assistantMessage, organizationId, phaseId, allPhaseOutputKeys);
    } catch (parseError) {
      logger.warn('YAML parser error (non-fatal)', { error: String(parseError) });
    }

    // Auto-save extracted outputs as drafts
    const autoSavedKeys: string[] = [];
    if (yamlOutputs.length > 0) {
      for (const output of yamlOutputs) {
        const existing = (allOutputs || []).find(o => o.output_key === output.output_key && o.is_locked);
        if (existing) continue;

        const { error: upsertError } = await supabase
          .from('presence_outputs')
          .upsert(
            {
              organization_id: organizationId,
              phase_id: phaseId,
              output_key: output.output_key,
              output_value: output.output_value,
              is_locked: false,
            },
            { onConflict: 'organization_id,output_key' }
          );

        if (!upsertError) {
          autoSavedKeys.push(output.output_key);
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      outputs: yamlOutputs.length > 0 ? yamlOutputs : undefined,
      autoSavedOutputs: autoSavedKeys.length > 0 ? autoSavedKeys : undefined,
      tokensUsed: requestTokens,
      creditsCharged: creditsForThisMessage,
      phaseCreditsUsed: newCreditTotal,
      persistenceWarning,
      modelName: resolvedModel.name,
      agentId: agent?.id,
      agentName: agent?.name,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Presence chat error', { error: errorMessage });
    return NextResponse.json({ error: `AI processing failed: ${errorMessage}` }, { status: 500 });
  }
}

// ─── System Prompt Builder ─────────────────────────────────────────────────────

function buildSystemPrompt(
  phase: { number: string; name: string; instructions: string; questions: string[]; outputVariables: string[]; questionOutputMap?: Record<string, string[]> },
  lockedOutputs: Record<string, unknown>,
  draftOutputs: Record<string, unknown>,
  currentPhaseOutputs: Record<string, unknown>,
  brandContext: string,
  orgName: string,
  currentQuestionIndex: number,
  agentBlock: string,
  currentOutputKeys: string[],
): string {
  const totalQuestions = phase.questions.length;
  const currentQuestionNum = currentQuestionIndex + 1;
  const visibleQuestions = phase.questions.slice(0, currentQuestionIndex + 1);

  const lockedSection = compressOutputs(lockedOutputs);
  const phaseDecisions = compressOutputs(currentPhaseOutputs);
  const draftSection = compressOutputs(draftOutputs);

  return `You are a Presence Engine expert guiding ${orgName} through the SkaleFlow™ Presence Engine.

${agentBlock}

## ROLE & STYLE
Unlike the Brand Engine where you extract information, in the Presence Engine you PROPOSE and REFINE.
- **Present polished, ready-to-use copy** — headlines, bios, about sections, CTAs — for the user to review.
- **SHORT messages**: 2-3 paragraphs max. Lead with strategic insight. No filler.
- **ONE question** per message.
- Ground ALL proposals in the user's Brand Engine outputs — their positioning, ICP, archetype, voice, and offers.
- When the user agrees or refines, immediately output the final version as YAML.

## BRAND ENGINE CONTEXT (use this to write platform-specific copy)
${brandContext || 'No Brand Engine data available yet — ask the user for their brand positioning.'}

## PHASE ${phase.number}: ${phase.name}
${phase.instructions}

## QUESTION ${currentQuestionNum} of ${totalQuestions}
Focus ONLY on this question. Do NOT move ahead.
**Q${currentQuestionNum}:** ${phase.questions[currentQuestionIndex]}

${visibleQuestions.length > 1 ? `Completed: ${visibleQuestions.slice(0, -1).map((q, i) => `${i + 1}. ${q}`).join(' | ')}` : ''}

## OUTPUT VARIABLES: ${currentOutputKeys.join(', ')}

## PRIOR PRESENCE DECISIONS (locked from earlier phases)
${lockedSection}

${phaseDecisions ? `## THIS PHASE — Already Decided\n${phaseDecisions}` : ''}

${draftSection ? `## IMPORTED DRAFTS (review with user)\n${draftSection}` : ''}

## RULES
1. **Always present a concrete proposal first** — don't ask "what do you want?", show them what you'd recommend based on their brand.
2. After presenting copy, ask "Would you like to refine this, or shall I structure it for saving?"
3. YAML must reflect the FINAL agreed version. After YAML: "Click **Save & Continue** to lock it in."
4. When user asks for help: provide 2-3 specific options tied to THEIR brand.
5. Never re-ask what was already answered in this thread.
6. User may attach screenshots — analyze them and suggest improvements.

## YAML FORMAT
\`\`\`yaml
${currentOutputKeys.map(k => `${k}: [content]`).join('\n')}
\`\`\``;
}

function compressOutputs(outputs: Record<string, unknown>): string {
  const entries = Object.entries(outputs);
  if (entries.length === 0) return 'None yet.';
  return entries.map(([key, val]) => {
    const label = key.replace(/_/g, ' ');
    if (val === null || val === undefined || val === '') return `- ${label}: (empty)`;
    if (typeof val === 'string') return `- ${label}: ${val.length > 250 ? val.slice(0, 250) + '...' : val}`;
    if (typeof val === 'object') {
      const json = JSON.stringify(val);
      return `- ${label}: ${json.length > 300 ? json.slice(0, 300) + '...' : json}`;
    }
    return `- ${label}: ${String(val)}`;
  }).join('\n');
}

// ─── YAML Parser ───────────────────────────────────────────────────────────────

function parseYamlFromResponse(
  response: string,
  organizationId: string,
  phaseId: string,
  expectedKeys?: Set<string>,
): Array<{ organization_id: string; phase_id: string; output_key: string; output_value: Json; is_locked: boolean }> {
  const outputs: Array<{ organization_id: string; phase_id: string; output_key: string; output_value: Json; is_locked: boolean }> = [];

  const yamlRegex = /```yaml\n?([\s\S]*?)\n?```/g;
  const yamlBlocks: string[] = [];
  let blockMatch;
  while ((blockMatch = yamlRegex.exec(response)) !== null) {
    yamlBlocks.push(blockMatch[1]);
  }
  if (yamlBlocks.length === 0) return outputs;

  const yamlContent = yamlBlocks.join('\n');
  const seenKeys = new Set<string>();
  const lines = yamlContent.split('\n');
  let currentKey = '';
  let currentLines: string[] = [];
  let inArray = false;

  function stripQuotes(s: string): string {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s;
  }

  function saveCurrentKey() {
    if (currentKey && !seenKeys.has(currentKey)) {
      seenKeys.add(currentKey);
      let outputValue: Json;
      if (inArray) {
        outputValue = currentLines as Json;
      } else if (currentLines.length > 0) {
        outputValue = currentLines.map(l => l.trim()).join('\n').trim();
      } else {
        outputValue = '';
      }
      outputs.push({
        organization_id: organizationId,
        phase_id: phaseId,
        output_key: currentKey,
        output_value: outputValue,
        is_locked: false,
      });
    }
  }

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    const isRecognizedKey = keyMatch && !line.match(/^\s/) && (!expectedKeys || expectedKeys.has(keyMatch[1]));

    if (isRecognizedKey && keyMatch) {
      saveCurrentKey();
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      currentLines = [];
      inArray = false;

      if (value === '' || value === '|' || value === '|-') {
        // block content follows
      } else if (value.startsWith('[')) {
        try {
          currentLines = JSON.parse(value.replace(/'/g, '"'));
          inArray = true;
        } catch {
          currentLines = [value];
        }
      } else {
        currentLines = [stripQuotes(value)];
      }
    } else if (currentKey) {
      if (line.trim().startsWith('- ')) {
        if (!inArray) {
          inArray = true;
          currentLines = [];
        }
        currentLines.push(stripQuotes(line.trim().slice(2).trim()));
      } else if (line.trim()) {
        currentLines.push(line);
      }
    }
  }
  saveCurrentKey();

  return outputs;
}
