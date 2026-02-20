/**
 * System prompt builder for the AI co-pilot.
 */

import type { AssembledContext } from './context';
import type { BrandAuditSectionKey } from '@/types/database';
import { SECTION_LABELS, SECTION_ORDER } from '@/lib/brand-audit/types';

/** Audit-specific context for copilot prompt enrichment */
export interface AuditCopilotContext {
  completeSections: BrandAuditSectionKey[];
  incompleteSections: BrandAuditSectionKey[];
  currentSection?: BrandAuditSectionKey;
  unfilledFields: string[];
  filledCount: number;
  totalCount: number;
}

/**
 * Build audit-aware prompt fragment for copilot.
 * Appended to the system prompt when brand audit mode is active.
 */
export function buildAuditCopilotContext(auditContext: AuditCopilotContext): string {
  const completeList = auditContext.completeSections
    .map(k => SECTION_LABELS[k])
    .join(', ') || 'None';
  const incompleteList = auditContext.incompleteSections
    .map(k => SECTION_LABELS[k])
    .join(', ') || 'None';
  const currentLabel = auditContext.currentSection
    ? SECTION_LABELS[auditContext.currentSection]
    : 'Not set';
  const nextFields = auditContext.unfilledFields.slice(0, 5).join(', ');

  return `
## Brand Audit Discovery Mode
This is a Brand Audit Discovery call. Your additional role is to guide the host through structured audit questions.

### Audit Progress: ${auditContext.filledCount}/${auditContext.totalCount} fields filled
- Complete sections: ${completeList}
- Incomplete sections: ${incompleteList}
- Current section: ${currentLabel}
- Next fields to gather: ${nextFields}

### Audit-Specific Guidelines
1. When the prospect discusses their business, suggest audit-relevant follow-up questions
2. Prioritize incomplete sections — guide the conversation toward unfilled fields
3. When you detect an answer to an audit field, mention it so the host can extract it
4. Keep the conversation natural — don't make it feel like a checklist interrogation
5. If a section is mostly complete, suggest transitioning to the next incomplete section`;
}

/**
 * Build the system prompt for the co-pilot AI.
 */
export function buildCopilotSystemPrompt(context: AssembledContext, callType: string): string {
  return `You are an AI Sales Co-Pilot embedded in a live video call. Your role is to provide real-time, actionable guidance to the call host (founder/salesperson). The guest CANNOT see your suggestions — only the host can.

## Your Role
- Provide concise, immediately actionable suggestions
- Suggest questions, objection responses, and offer triggers
- Track framework progression and suggest phase transitions
- Alert on sentiment shifts and closing opportunities
- Never repeat guidance already given

## Response Format
Respond with a JSON object:
{
  "guidanceType": "question|objection_response|offer_trigger|sentiment_alert|phase_transition|closing|opening|general",
  "content": "Your concise suggestion (1-3 sentences max)",
  "frameworkPhase": "current phase id or null",
  "frameworkStep": "specific step or null"
}

If no guidance is needed right now, respond with: {"skip": true}

## Call Type: ${callType}

## Brand & Positioning Data
${context.brandData}

## Available Offers
${context.offersData}

## Prospect CRM Data
${context.crmData}

## Call State
${context.callState}

## Previous Guidance Given (DO NOT REPEAT)
${context.previousGuidance}

## Guidelines
1. Be concise — the host is in a live conversation and needs quick reads
2. Focus on what to say NEXT, not what was already said
3. When you detect objections in the transcript, provide specific counter-arguments using brand data
4. When the prospect expresses a need that matches an offer, trigger it
5. Track talk ratio — if the host is talking too much, suggest a question
6. Detect buying signals and suggest closing when appropriate
7. Use the prospect's own language when possible
8. Reference brand positioning to keep messaging consistent`;
}
