import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getPhaseTemplate } from '@/config/phases';
import { logger } from '@/lib/logger';
import { isPhaseAccessible } from '@/lib/phase-access';
import type { Json } from '@/types/database';
import { resolveModel, requireCredits, calculateCreditCost, deductCredits, getProviderAdapterForUser } from '@/lib/ai/server';
import type { AIFeature } from '@/lib/ai/server';
import { ARCHETYPE_PROFILES, getArchetypeProfile, formatArchetypeForPrompt, getAllArchetypesSummary } from '@/lib/brand/archetype-profiles';
import { getAgentForQuestion, formatAgentForPrompt } from '@/config/phase-agents';
import { hasPermission } from '@/lib/permissions';
import { checkTeamCredits, deductTeamCredits } from '@/lib/team-credits';
import { isAiBetaEnabled, getUserApiKey } from '@/lib/ai/user-keys';

// Allow up to 60s for AI calls (Phase 8+ has large system prompts with all prior locked outputs)
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

    // Parse request — supports both JSON (text-only) and FormData (with files)
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

    // Check team member has brand_engine chat permission
    const hasChatPerm = await hasPermission(organizationId, user.id, 'brand_engine', 'chat');
    if (!hasChatPerm) {
      return NextResponse.json({ error: 'You do not have permission to use the Brand Engine chat.' }, { status: 403 });
    }

    logger.info('Brand chat request received', { organizationId, phaseId, userId: user.id, fileCount: files.length });

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

    // --- Server-side sequential phase gate ---
    const { data: allPhases } = await supabase
      .from('brand_phases')
      .select('id, status')
      .eq('organization_id', organizationId)
      .order('sort_order');

    if (!allPhases || !isPhaseAccessible(allPhases, phaseId)) {
      return NextResponse.json({ error: 'This phase is not yet accessible. Complete earlier phases first.' }, { status: 403 });
    }

    // Get phase template
    const phaseTemplate = getPhaseTemplate(phase.phase_number);
    if (!phaseTemplate) {
      return NextResponse.json({ error: 'Phase template not found' }, { status: 404 });
    }

    // Get ALL outputs for context (locked from any phase, and unlocked drafts for current phase)
    const { data: allOutputs } = await supabase
      .from('brand_outputs')
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
      // All outputs for the current phase (locked + unlocked) — gives AI full context
      // of what was decided in earlier questions of this same phase
      if (o.phase_id === phaseId) {
        currentPhaseOutputs[o.output_key] = o.output_value;
      }
    }

    // Get conversation history
    const { data: conversation } = await supabase
      .from('brand_conversations')
      .select('messages, tokens_used, credits_used')
      .eq('organization_id', organizationId)
      .eq('phase_id', phaseId)
      .single();

    const allPreviousMessages = (conversation?.messages as Array<{ role: string; content: string }>) || [];

    // Trim conversation history to last 10 messages (5 exchanges) to control token costs.
    // Prior context is preserved in locked outputs and phase decisions — we don't need to
    // re-send the entire history every time. This saves thousands of tokens per request.
    const MAX_HISTORY = 10;
    const previousMessages = allPreviousMessages.length > MAX_HISTORY
      ? allPreviousMessages.slice(-MAX_HISTORY)
      : allPreviousMessages;

    logger.info('Conversation context loaded', {
      organizationId,
      phaseId,
      totalMessages: allPreviousMessages.length,
      sentMessages: previousMessages.length,
      trimmed: allPreviousMessages.length > MAX_HISTORY,
      isNewConversation: !conversation,
    });

    // Check if there's an uploaded logo for this org (to inject into Phase 7 conversations)
    let orgLogoUrl: string | null = null;
    if (phase.phase_number === '7') {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('id', organizationId)
        .single();
      orgLogoUrl = orgData?.logo_url || null;

      // Also check brand_outputs for brand_logo_url
      if (!orgLogoUrl) {
        const { data: logoOutput } = await supabase
          .from('brand_outputs')
          .select('output_value')
          .eq('organization_id', organizationId)
          .eq('output_key', 'brand_logo_url')
          .single();
        if (logoOutput?.output_value && typeof logoOutput.output_value === 'string' && logoOutput.output_value !== 'none') {
          orgLogoUrl = logoOutput.output_value;
        }
      }
    }

    // Build system prompt with current question index for sequential enforcement
    const currentQuestionIndex = (phase as Record<string, unknown>).current_question_index as number ?? 0;
    const agent = getAgentForQuestion(phase.phase_number, currentQuestionIndex);
    const systemPrompt = buildSystemPrompt(phaseTemplate, lockedOutputs, org?.name || 'Your Organization', currentQuestionIndex, draftOutputs, orgLogoUrl, agent ? formatAgentForPrompt(agent) : null, currentPhaseOutputs);

    // Build the user message content for Claude (with file content blocks if files attached)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messageContent: string | any[];

    if (files.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentBlocks: any[] = [];

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');

        if (file.type.startsWith('image/')) {
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: file.type,
              data: base64,
            },
          });
        } else if (file.type === 'application/pdf') {
          // Use Claude's native PDF document support
          contentBlocks.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          });
        }
      }

      // Add the user's text message (or a default prompt if only files)
      contentBlocks.push({
        type: 'text',
        text: message || 'Please analyze the attached file(s) and use them to help answer the current question.',
      });

      messageContent = contentBlocks;

      logger.info('File content blocks built', {
        imageCount: files.filter(f => f.type.startsWith('image/')).length,
        pdfCount: files.filter(f => f.type === 'application/pdf').length,
      });
    } else if (orgLogoUrl && phase.phase_number === '7') {
      // Phase 7: inject the uploaded logo image so Claude can see and discuss it
      try {
        const logoResponse = await fetch(orgLogoUrl);
        if (logoResponse.ok) {
          const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
          const logoBase64 = logoBuffer.toString('base64');
          const logoContentType = logoResponse.headers.get('content-type') || 'image/png';

          messageContent = [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: logoContentType,
                data: logoBase64,
              },
            },
            {
              type: 'text',
              text: `${message}\n\n[The user's uploaded logo is shown above. You can see and reference it in your response.]`,
            },
          ];

          logger.info('Logo image injected into Phase 7 conversation', { organizationId, logoUrl: orgLogoUrl });
        } else {
          messageContent = message;
        }
      } catch (logoFetchError) {
        logger.warn('Failed to fetch logo for injection', { organizationId, error: String(logoFetchError) });
        messageContent = message;
      }
    } else {
      messageContent = message;
    }

    // Resolve AI model (override > org preference > default)
    const resolvedModel = await resolveModel(organizationId, 'brand_chat' as AIFeature, modelOverride);
    const useDirectClaude = resolvedModel.provider === 'anthropic' && (files.length > 0 || (orgLogoUrl && phase.phase_number === '7'));

    // Check if user has their own API key (for credit bypass)
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

    // Pre-flight credit check (skip for free models, super_admins, and user-key users)
    if (!usingUserKey) {
      const creditResponse = await requireCredits(organizationId, resolvedModel.id, 2000, 1000, user.id);
      if (creditResponse) return creditResponse;
    }

    let assistantMessage: string;
    let inputTokens: number;
    let outputTokens: number;

    try {
      if (useDirectClaude) {
        // Use Anthropic SDK directly for file uploads / image content blocks
        const claudeMessages = [
          ...previousMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: messageContent },
        ];

        logger.info('Calling Claude API (direct)', { model: resolvedModel.modelId, messageCount: claudeMessages.length });

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
        // Use provider adapter (works for Claude text-only, Gemini, Groq)
        const { adapter } = await getProviderAdapterForUser(resolvedModel.provider, user.id);
        const textMessages = [
          ...previousMessages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          { role: 'user' as const, content: typeof messageContent === 'string' ? messageContent : message },
        ];

        logger.info('Calling AI provider', { provider: resolvedModel.provider, model: resolvedModel.modelId, messageCount: textMessages.length });

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
      logger.error('AI provider call failed', {
        provider: resolvedModel.provider,
        model: resolvedModel.modelId,
        error: aiMsg,
        systemPromptLength: systemPrompt.length,
        messageCount: previousMessages.length + 1,
      });
      return NextResponse.json(
        { error: `AI call failed (${resolvedModel.provider}): ${aiMsg}` },
        { status: 502 }
      );
    }

    if (!assistantMessage) {
      logger.error('AI returned empty response', { provider: resolvedModel.provider, model: resolvedModel.modelId });
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    const requestTokens = inputTokens + outputTokens;

    logger.info('AI response received', {
      provider: resolvedModel.provider,
      model: resolvedModel.modelId,
      inputTokens,
      outputTokens,
      responseLength: assistantMessage.length,
    });

    // Build stored user content (text representation for conversation history)
    const fileNames = files.map(f => f.name);
    const storedUserContent = files.length > 0
      ? `${message}${message ? '\n\n' : ''}[Attached files: ${fileNames.join(', ')}]`
      : message;

    const attachmentMeta = files.length > 0
      ? files.map(f => ({ name: f.name, type: f.type, size: f.size }))
      : undefined;

    // Build new message list — use FULL history for persistence, not the trimmed version
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

    // Save conversation (critical — if this fails, data is lost)
    // Note: creditsCharged is computed below but we need the value here too.
    // We compute it early so we can store it alongside the conversation.
    const creditsForThisMessage = usingUserKey ? 0 : calculateCreditCost(resolvedModel.id, inputTokens, outputTokens);
    let newCreditTotal = 0;

    if (conversation) {
      const previousTokens = conversation.tokens_used ?? 0;
      const newTokenTotal = previousTokens + requestTokens;
      newCreditTotal = (conversation.credits_used ?? 0) + creditsForThisMessage;

      const { error: updateError } = await supabase
        .from('brand_conversations')
        .update({
          messages: newMessages,
          tokens_used: newTokenTotal,
          credits_used: newCreditTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('phase_id', phaseId);

      if (updateError) {
        logger.error('Failed to update conversation', { organizationId, phaseId, error: updateError.message });
        persistenceWarning = true;
      }
    } else {
      newCreditTotal = creditsForThisMessage;

      const { error: insertError } = await supabase
        .from('brand_conversations')
        .insert({
          organization_id: organizationId,
          phase_id: phaseId,
          user_id: user.id,
          messages: newMessages,
          tokens_used: requestTokens,
          credits_used: creditsForThisMessage,
        });

      if (insertError) {
        logger.error('Failed to insert conversation', { organizationId, phaseId, error: insertError.message });
        persistenceWarning = true;
      }
    }

    // Update phase status to in_progress if not_started
    if (phase.status === 'not_started') {
      logger.info('Phase status transition', { phaseId, from: 'not_started', to: 'in_progress' });

      const { error: phaseError } = await supabase
        .from('brand_phases')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', phaseId);

      if (phaseError) {
        logger.warn('Failed to update phase status', { phaseId, error: phaseError.message });
      }
    }

    // Track AI usage (creditsForThisMessage was computed earlier for conversation tracking)
    const creditsCharged = creditsForThisMessage;

    const { data: usageRow, error: usageError } = await supabase
      .from('ai_usage')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        feature: 'brand_engine',
        model: resolvedModel.modelId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        credits_charged: creditsCharged,
        provider: resolvedModel.provider,
        is_free_model: resolvedModel.isFree,
      })
      .select('id')
      .single();

    if (usageError) {
      logger.warn('Failed to track AI usage', { organizationId, error: usageError.message });
    }

    // Deduct credits (only for paid models) — routes through team credits for team members
    if (creditsCharged > 0) {
      await deductTeamCredits(
        organizationId,
        user.id,
        'brand_engine',
        creditsCharged,
        `Brand chat — ${resolvedModel.name}`,
        usageRow?.id || null
      );
    }

    // Parse outputs from response if YAML block is present
    // Pass all known output keys for this phase so the parser only recognizes valid variables
    // Wrapped in try-catch so parser errors never break the API response
    const allPhaseOutputKeys = new Set(phaseTemplate.outputVariables);
    let yamlOutputs: ReturnType<typeof parseYamlFromResponse> = [];
    try {
      yamlOutputs = parseYamlFromResponse(assistantMessage, organizationId, phaseId, allPhaseOutputKeys);
    } catch (parseError) {
      logger.warn('YAML parser error (non-fatal)', { error: parseError instanceof Error ? parseError.message : String(parseError) });
    }

    if (yamlOutputs.length > 0) {
      logger.info('YAML outputs parsed', { outputKeys: yamlOutputs.map(o => o.output_key) });
    }

    // Auto-save extracted outputs as drafts (never overwrite locked values)
    const autoSavedKeys: string[] = [];
    if (yamlOutputs.length > 0) {
      for (const output of yamlOutputs) {
        // Check if already locked — never overwrite confirmed values
        const existing = (allOutputs || []).find(
          o => o.output_key === output.output_key && o.is_locked
        );
        if (existing) continue;

        const { error: upsertError } = await supabase
          .from('brand_outputs')
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

        if (upsertError) {
          logger.warn('Failed to auto-save output', {
            outputKey: output.output_key,
            error: upsertError.message,
          });
        } else {
          autoSavedKeys.push(output.output_key);
        }
      }

      if (autoSavedKeys.length > 0) {
        logger.info('Auto-saved outputs as drafts', { keys: autoSavedKeys });
      }
    }

    logger.info('Brand chat request complete', {
      organizationId,
      phaseId,
      tokensUsed: requestTokens,
      outputCount: yamlOutputs.length,
      persistenceWarning,
    });

    return NextResponse.json({
      message: assistantMessage,
      outputs: yamlOutputs.length > 0 ? yamlOutputs : undefined,
      autoSavedOutputs: autoSavedKeys.length > 0 ? autoSavedKeys : undefined,
      tokensUsed: requestTokens,
      creditsCharged,
      phaseCreditsUsed: newCreditTotal,
      persistenceWarning,
      modelName: resolvedModel.name,
      agentId: agent?.id,
      agentName: agent?.name,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Brand chat error', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `AI processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/** Compress locked outputs into a compact one-line-per-key format to save tokens.
 *  Skips keys already shown in other prompt sections to avoid duplication. */
function compressOutputsForPrompt(
  outputs: Record<string, unknown>,
  skipKeys: Set<string> = new Set()
): string {
  const entries = Object.entries(outputs).filter(([k]) => !skipKeys.has(k));
  if (entries.length === 0) return 'None yet.';

  return entries.map(([key, val]) => {
    const label = key.replace(/_/g, ' ');
    if (val === null || val === undefined || val === '') return `- ${label}: (empty)`;
    if (typeof val === 'string') {
      // Truncate long strings to save tokens
      return `- ${label}: ${val.length > 250 ? val.slice(0, 250) + '...' : val}`;
    }
    if (typeof val === 'object') {
      const json = JSON.stringify(val);
      return `- ${label}: ${json.length > 300 ? json.slice(0, 300) + '...' : json}`;
    }
    return `- ${label}: ${String(val)}`;
  }).join('\n');
}

function buildSystemPrompt(
  phase: { number: string; name: string; instructions: string; questions: string[]; outputVariables: string[]; questionOutputMap?: Record<number, string[]> },
  lockedOutputs: Record<string, unknown>,
  orgName: string,
  currentQuestionIndex: number,
  draftOutputs: Record<string, unknown> = {},
  logoUrl: string | null = null,
  agentPersonaBlock: string | null = null,
  currentPhaseOutputs: Record<string, unknown> = {}
): string {
  const totalQuestions = phase.questions.length;
  const currentQuestionNum = currentQuestionIndex + 1;

  // Only show questions up to and including the current one
  const visibleQuestions = phase.questions.slice(0, currentQuestionIndex + 1);

  // Get the output variables for the current question
  const currentOutputKeys = phase.questionOutputMap?.[currentQuestionIndex] || [];

  // Build archetype context — compact version for prompt (full profile is expensive)
  let archetypeSection = '';
  const archetypeVal = lockedOutputs['brand_archetype'] || draftOutputs['brand_archetype'];

  if (archetypeVal) {
    let archetypeName: string | null = null;
    if (typeof archetypeVal === 'object' && archetypeVal !== null && 'name' in (archetypeVal as Record<string, unknown>)) {
      archetypeName = (archetypeVal as Record<string, unknown>).name as string;
    } else if (typeof archetypeVal === 'string') {
      archetypeName = archetypeVal;
    }

    if (archetypeName) {
      const profile = getArchetypeProfile(archetypeName);
      if (profile) {
        // Compact archetype: only the fields that directly guide strategy (saves ~150 tokens vs full)
        archetypeSection = `\n\n## BRAND ARCHETYPE: ${profile.name} — "${profile.motto}"
Voice: ${profile.brand_voice.join(', ')} | Strategy: ${profile.strategy}
Sales: ${profile.sales_approach} | Visual: ${profile.visual_style}
Colors: ${profile.color_associations.join(', ')} | Content: ${profile.content_pillars.join(', ')}
StoryBrand Guide: ${profile.storybrand_guide_style}`;
      }
    }
  }

  // For Phase 1 Q4 (archetype selection), inject all 12 archetypes summary
  let archetypeSelectionSection = '';
  if (phase.number === '1' && currentQuestionIndex === 4) {
    archetypeSelectionSection = `\n\n## ALL 12 BRAND ARCHETYPES (for selection)\nSuggest 2-3 best-fit archetypes from this list based on the user's prior answers:\n\n${getAllArchetypesSummary()}`;
  }

  // Keys to skip in locked outputs (shown separately in other sections)
  const skipInLocked = new Set<string>();
  skipInLocked.add('brand_archetype'); // shown in archetype section
  for (const k of Object.keys(currentPhaseOutputs)) skipInLocked.add(k); // shown in phase decisions

  // Locked outputs: compact format (saves ~60% tokens vs pretty-printed JSON)
  const lockedSection = compressOutputsForPrompt(lockedOutputs, skipInLocked);

  // Current phase decisions: compact
  const phaseDecisions = Object.keys(currentPhaseOutputs).length > 0
    ? Object.entries(currentPhaseOutputs).map(([k, v]) => {
        const val = typeof v === 'string' ? v : JSON.stringify(v);
        return `- ${k.replace(/_/g, ' ')}: ${val.length > 300 ? val.slice(0, 300) + '...' : val}`;
      }).join('\n')
    : '';

  // Draft outputs: compact
  const draftSection = Object.keys(draftOutputs).length > 0
    ? compressOutputsForPrompt(draftOutputs)
    : '';

  return `You are a Brand Strategist guiding ${orgName} through the SkaleFlow™ Brand Engine.
${agentPersonaBlock ? `\n${agentPersonaBlock}\n` : ''}
## ROLE & STYLE
Expert guide, not decision-maker. User is the expert on their business. You listen, clarify, refine, and structure — never override.
- **SHORT messages**: 2-3 paragraphs max. Lead with strategic insight. No filler.
- **ONE question** per message. Use bullets for summaries.
- Don't inject ideas unless asked. If user gives a clear answer, structure it immediately.
- Ground ALL suggestions in their prior outputs (archetype, ICP, values, positioning).

## PHASE ${phase.number}: ${phase.name}
${phase.instructions}

## QUESTION ${currentQuestionNum} of ${totalQuestions}
Focus ONLY on this question. Do NOT move ahead.
**Q${currentQuestionNum}:** ${phase.questions[currentQuestionIndex]}

${visibleQuestions.length > 1 ? `Completed: ${visibleQuestions.slice(0, -1).map((q, i) => `${i + 1}. ${q}`).join(' | ')}` : ''}

## OUTPUT VARIABLES: ${currentOutputKeys.join(', ')}

## PRIOR DECISIONS (locked from earlier phases)
${lockedSection}
${archetypeSection}
${archetypeSelectionSection}
${logoUrl ? `\nLogo uploaded: ${logoUrl}` : ''}

${phaseDecisions ? `## THIS PHASE — Already Decided (treat as facts, build on them)\n${phaseDecisions}` : ''}

${draftSection ? `## IMPORTED DRAFTS (review with user, don't start from scratch)\n${draftSection}` : ''}

## RULES
1. User's words = source of truth. Refine for clarity, never substitute.
2. No YAML until user confirms direction. Summarize first, then ask "Want me to structure this?" Exception: Phase 8 includes YAML in initial proposal.
3. YAML must reflect what user said. After YAML: "Click **Save & Continue** to lock it in. Want to change anything?"
4. When user asks for help: 2-3 specific options with one sentence each, tied to THEIR brand. Let them choose.
5. Never re-ask what was already answered in this thread.
6. For brand_archetype (P1 Q4): output FULL profile with all 24 fields.
7. For P10 Q5: reference ALL prior outputs for the conversion plan.
8. User may attach files — examine and confirm how they want to use the content.

## YAML FORMAT
\`\`\`yaml
${currentOutputKeys.map(k => `${k}: [content]`).join('\n')}
\`\`\``;
}

function parseYamlFromResponse(
  response: string,
  organizationId: string,
  phaseId: string,
  expectedKeys?: Set<string>
): Array<{
  organization_id: string;
  phase_id: string;
  output_key: string;
  output_value: Json;
  is_locked: boolean;
}> {
  const outputs: Array<{
    organization_id: string;
    phase_id: string;
    output_key: string;
    output_value: Json;
    is_locked: boolean;
  }> = [];

  // Find ALL YAML blocks (AI may split outputs across multiple blocks)
  const yamlRegex = /```yaml\n?([\s\S]*?)\n?```/g;
  const yamlBlocks: string[] = [];
  let blockMatch;
  while ((blockMatch = yamlRegex.exec(response)) !== null) {
    yamlBlocks.push(blockMatch[1]);
  }
  if (yamlBlocks.length === 0) return outputs;

  // Merge all YAML blocks into one content string
  const yamlContent = yamlBlocks.join('\n');

  // Track already-seen keys to avoid duplicates across blocks
  const seenKeys = new Set<string>();

  // Simple, robust YAML parsing: recognize top-level keys that match expected output variables,
  // then collect everything indented underneath as the value (either as nested object or text).
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

  function parseNestedContent(contentLines: string[]): Json {
    // Parse YAML-like content with proper indentation-based nesting.
    // Handles both flat (buttons: "desc") and deep nested (primary: { hex, rgb, role }).
    // Uses a stack to track nesting depth by indentation level.
    type YamlObj = Record<string, unknown>;
    const root: YamlObj = {};
    const stack: Array<{ obj: YamlObj; indent: number }> = [{ obj: root, indent: -1 }];

    for (const rawLine of contentLines) {
      if (!rawLine.trim()) continue;

      // Measure indentation (lines may have preserved whitespace)
      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].length : 0;
      const trimmed = rawLine.trim();

      const kvMatch = trimmed.match(/^(\w[\w_\-]*):\s*(.*)$/);
      if (!kvMatch) continue;

      const key = kvMatch[1];
      let val = kvMatch[2].trim();
      val = stripQuotes(val);

      // Pop stack to find the correct parent (must have strictly lower indent)
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (val === '' || val === '|' || val === '|-') {
        // Sub-object follows on indented lines
        const child: YamlObj = {};
        parent[key] = child;
        stack.push({ obj: child, indent });
      } else {
        parent[key] = val;
      }
    }

    if (Object.keys(root).length > 0) return root as Json;
    // Fallback: join as plain text
    return contentLines.map(l => l.trim()).filter(Boolean).join('\n');
  }

  function saveCurrentKey() {
    if (currentKey && !seenKeys.has(currentKey)) {
      seenKeys.add(currentKey);
      let outputValue: Json;

      if (inArray) {
        outputValue = currentLines as Json;
      } else if (currentLines.length > 0) {
        // Check if content looks like nested key-value pairs
        const hasNestedKeys = currentLines.some(l => {
          const t = l.trim();
          return /^\w[\w_]*:\s*.+/.test(t) || /^\w[\w_]*:\s*$/.test(t);
        });
        if (hasNestedKeys) {
          outputValue = parseNestedContent(currentLines);
        } else {
          outputValue = currentLines.map(l => l.trim()).join('\n').trim();
        }
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
    // Check for top-level key (no leading whitespace, recognized output variable)
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    const isRecognizedKey = keyMatch && !line.match(/^\s/) &&
      (!expectedKeys || expectedKeys.has(keyMatch[1]));

    if (isRecognizedKey && keyMatch) {
      saveCurrentKey();
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      currentLines = [];
      inArray = false;

      if (value === '' || value === '|' || value === '|-') {
        // Block content follows on next lines
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
    } else if (currentKey && line.match(/^\s+- /)) {
      // Array item (any indentation)
      currentLines.push(line.replace(/^\s+- /, '').trim());
      inArray = true;
    } else if (currentKey && line.match(/^\s/) && line.trim()) {
      // Keep original indentation for nested structure parsing
      currentLines.push(line);
    } else if (currentKey && !line.match(/^\s/) && line.trim() !== '') {
      // Non-indented, non-empty line that's NOT a recognized key — treat as continuation
      currentLines.push(line.trim());
    }
  }

  saveCurrentKey();

  return outputs;
}
