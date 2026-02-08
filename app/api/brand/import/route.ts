import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { PHASE_TEMPLATES } from '@/config/phases';
import {
  extractTextFromFile,
  PHASE_BATCHES,
  getOutputKeysForPhases,
  buildExtractionPrompt,
  parseJsonResponse,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
} from '@/lib/brand-import';
import type { Json } from '@/types/database';
import { checkCredits, calculateCreditCost, deductCredits } from '@/lib/ai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Brand import stays Claude-only (PDF analysis requires it)
const MODEL = 'claude-sonnet-4-5-20250929';
const MODEL_ID = 'claude-sonnet-4-5';
const MAX_TOKENS = 8192;

interface PhaseResult {
  phaseNumber: string;
  phaseName: string;
  extractedCount: number;
}

export async function POST(request: Request) {
  // --- Auth + org membership check (pre-stream validation) ---
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const organizationId = formData.get('organizationId') as string | null;
  const mode = formData.get('mode') as 'full' | 'phase' | null;
  const phaseId = formData.get('phaseId') as string | null;

  if (!file || !organizationId || !mode) {
    return NextResponse.json({ error: 'Missing required fields: file, organizationId, mode' }, { status: 400 });
  }

  if (mode === 'phase' && !phaseId) {
    return NextResponse.json({ error: 'phaseId is required for phase mode' }, { status: 400 });
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

  const fileName = file.name.toLowerCase();
  const ext = '.' + fileName.split('.').pop();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Only .pdf and .md files are accepted' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || (ext === '.pdf' ? 'application/pdf' : 'text/markdown');

  let documentText: string;
  try {
    documentText = await extractTextFromFile(buffer, mimeType);
  } catch (err) {
    logger.error('Failed to extract text from file', {
      fileName: file.name,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Failed to read file content. Please ensure the file is not corrupted.' }, { status: 400 });
  }

  if (!documentText || documentText.trim().length < 50) {
    return NextResponse.json({ error: 'Document appears to be empty or too short to extract meaningful content.' }, { status: 400 });
  }

  const { data: brandPhases } = await supabase
    .from('brand_phases')
    .select('id, phase_number, phase_name, status')
    .eq('organization_id', organizationId)
    .order('sort_order');

  if (!brandPhases || brandPhases.length === 0) {
    return NextResponse.json({ error: 'No brand phases found for this organization' }, { status: 404 });
  }

  const phaseMap = new Map(brandPhases.map(p => [p.phase_number, p]));

  const { data: lockedOutputs } = await supabase
    .from('brand_outputs')
    .select('output_key')
    .eq('organization_id', organizationId)
    .eq('is_locked', true);

  const lockedKeys = new Set(lockedOutputs?.map(o => o.output_key) || []);

  let batchesToProcess: string[][];

  if (mode === 'phase') {
    const targetPhase = brandPhases.find(p => p.id === phaseId);
    if (!targetPhase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }
    batchesToProcess = [[targetPhase.phase_number]];
  } else {
    batchesToProcess = PHASE_BATCHES;
  }

  logger.info('Brand import started', {
    organizationId,
    mode,
    phaseId,
    fileName: file.name,
    textLength: documentText.length,
    userId: user.id,
  });

  // --- Stream SSE response for real-time progress ---
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      const phaseResults: PhaseResult[] = [];
      const errors: string[] = [];
      let totalExtracted = 0;
      let totalVariables = 0;

      try {
        for (let batchIndex = 0; batchIndex < batchesToProcess.length; batchIndex++) {
          const batch = batchesToProcess[batchIndex];
          const batchLabel = batch.map(n => `Phase ${n}`).join(', ');
          const outputKeys = getOutputKeysForPhases(batch);
          const keysToExtract = outputKeys.filter(k => !lockedKeys.has(k.key));
          totalVariables += outputKeys.length;

          // Send progress event
          sendEvent('progress', {
            currentBatch: batchIndex + 1,
            totalBatches: batchesToProcess.length,
            batchLabel: `Analyzing ${batchLabel}...`,
          });

          if (keysToExtract.length === 0) {
            for (const phaseNum of batch) {
              const template = PHASE_TEMPLATES[phaseNum];
              if (template) {
                phaseResults.push({ phaseNumber: phaseNum, phaseName: template.name, extractedCount: 0 });
              }
            }
            continue;
          }

          logger.info('Processing batch', { batchIndex, batchLabel, keyCount: keysToExtract.length });

          try {
            // Pre-flight credit check per batch (super_admins bypass)
            const batchCreditCheck = await checkCredits(organizationId, 150, user.id);
            if (!batchCreditCheck.hasCredits) {
              sendEvent('error', {
                error: `Insufficient credits for ${batchLabel}. Need ~150 credits, have ${batchCreditCheck.totalRemaining}.`,
                creditExhausted: true,
                creditsAvailable: batchCreditCheck.totalRemaining,
              });
              break;
            }

            const systemPrompt = buildExtractionPrompt(keysToExtract);
            const expectedKeyNames = keysToExtract.map(k => k.key);

            const response = await anthropic.messages.create({
              model: MODEL,
              max_tokens: MAX_TOKENS,
              system: systemPrompt,
              messages: [
                {
                  role: 'user',
                  content: `<document>\n${documentText}\n</document>\n\nExtract the requested brand variables from this document. Return JSON only.`,
                },
              ],
            });

            const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

            // Calculate credits and track usage
            const creditsCharged = calculateCreditCost(MODEL_ID, response.usage.input_tokens, response.usage.output_tokens);

            const { data: usageRow } = await supabase.from('ai_usage').insert({
              organization_id: organizationId,
              user_id: user.id,
              feature: 'brand_import',
              model: MODEL,
              input_tokens: response.usage.input_tokens,
              output_tokens: response.usage.output_tokens,
              credits_charged: creditsCharged,
              provider: 'anthropic',
              is_free_model: false,
            }).select('id').single();

            // Deduct credits
            if (creditsCharged > 0) {
              await deductCredits(
                organizationId,
                user.id,
                creditsCharged,
                usageRow?.id || null,
                `Brand import — ${batchLabel}`
              );
            }

            const parsed = parseJsonResponse(responseText, expectedKeyNames);

            if (!parsed) {
              logger.warn('Failed to parse AI response for batch', { batchIndex, batchLabel });
              errors.push(`Batch ${batchIndex + 1} (${batchLabel}): Failed to parse AI response`);
              for (const phaseNum of batch) {
                const template = PHASE_TEMPLATES[phaseNum];
                if (template) {
                  phaseResults.push({ phaseNumber: phaseNum, phaseName: template.name, extractedCount: 0 });
                }
              }
              continue;
            }

            const extractedByPhase: Record<string, number> = {};

            for (const keyInfo of keysToExtract) {
              const value = parsed[keyInfo.key];
              if (value === null || value === undefined) continue;

              const phaseRecord = phaseMap.get(keyInfo.phaseNumber);
              if (!phaseRecord) continue;

              const { error: upsertError } = await supabase
                .from('brand_outputs')
                .upsert(
                  {
                    organization_id: organizationId,
                    phase_id: phaseRecord.id,
                    output_key: keyInfo.key,
                    output_value: value as Json,
                    is_locked: false,
                  },
                  { onConflict: 'organization_id,output_key' }
                );

              if (upsertError) {
                logger.warn('Failed to upsert brand output', { outputKey: keyInfo.key, error: upsertError.message });
              } else {
                totalExtracted++;
                extractedByPhase[keyInfo.phaseNumber] = (extractedByPhase[keyInfo.phaseNumber] || 0) + 1;
              }
            }

            for (const phaseNum of batch) {
              const template = PHASE_TEMPLATES[phaseNum];
              if (template) {
                phaseResults.push({
                  phaseNumber: phaseNum,
                  phaseName: template.name,
                  extractedCount: extractedByPhase[phaseNum] || 0,
                });
              }
            }

            if (mode === 'phase') {
              for (const phaseNum of batch) {
                const phaseRecord = phaseMap.get(phaseNum);
                if (
                  phaseRecord &&
                  phaseRecord.status === 'not_started' &&
                  (extractedByPhase[phaseNum] || 0) > 0
                ) {
                  await supabase
                    .from('brand_phases')
                    .update({
                      status: 'in_progress',
                      started_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', phaseRecord.id);
                }
              }
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            logger.error('Batch processing failed', { batchIndex, batchLabel, error: errMsg });
            errors.push(`Batch ${batchIndex + 1} (${batchLabel}): ${errMsg}`);

            for (const phaseNum of batch) {
              const template = PHASE_TEMPLATES[phaseNum];
              if (template) {
                phaseResults.push({ phaseNumber: phaseNum, phaseName: template.name, extractedCount: 0 });
              }
            }
          }
        }

        logger.info('Brand import complete', {
          organizationId,
          mode,
          totalExtracted,
          totalVariables,
          errorCount: errors.length,
        });

        // Send final complete event with full result
        sendEvent('complete', {
          success: true,
          extractedCount: totalExtracted,
          totalVariables,
          totalBatches: batchesToProcess.length,
          errors,
          phaseResults,
        });
      } catch (error) {
        logger.error('Brand import error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        sendEvent('error', { error: 'Failed to process import' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
