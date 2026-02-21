'use client';

import { useState } from 'react';
import type { GuidanceItem } from './call-room';

export interface TemplatePhase {
  name: string;
  duration_minutes: number;
  questions: string[];
  extraction_target?: string;
}

interface CopilotPanelProps {
  guidance: GuidanceItem[];
  callActive: boolean;
  transcriptCount?: number;
  /** When true, shows brand audit guidance alongside regular copilot items */
  brandAuditMode?: boolean;
  /** Next audit question/field to ask about */
  auditNextQuestion?: string;
  /** Template phases with guided questions */
  templatePhases?: TemplatePhase[];
}

const GUIDANCE_ICONS: Record<string, string> = {
  question: '?',
  objection_response: '!',
  offer_trigger: '$',
  sentiment_alert: '~',
  phase_transition: '>',
  closing: 'x',
  opening: 'o',
  general: 'i',
};

const GUIDANCE_COLORS: Record<string, string> = {
  question: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  objection_response: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  offer_trigger: 'bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30',
  sentiment_alert: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  phase_transition: 'bg-[#1E6B63]/20 text-[#1E6B63] border-[#1E6B63]/30',
  closing: 'bg-green-500/20 text-green-300 border-green-500/30',
  opening: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  general: 'bg-cream-warm/10 text-white/70 border-white/20',
};

export function CopilotPanel({ guidance, callActive, transcriptCount = 0, brandAuditMode, auditNextQuestion, templatePhases }: CopilotPanelProps) {
  const activeGuidance = guidance.filter(g => !g.wasDismissed);
  const [activePhaseIdx, setActivePhaseIdx] = useState(0);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (qKey: string) => {
    setCheckedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qKey)) next.delete(qKey);
      else next.add(qKey);
      return next;
    });
  };

  const hasPhases = templatePhases && templatePhases.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
          AI Co-Pilot
          {brandAuditMode && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal/20 text-teal border border-teal/30">
              Audit Mode
            </span>
          )}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Template phases navigation — shown when a call template has phases */}
        {hasPhases && callActive && (
          <div className="space-y-2">
            {/* Phase tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {templatePhases.map((phase, i) => {
                const phaseQuestions = phase.questions || [];
                const completedCount = phaseQuestions.filter((_, qi) => checkedQuestions.has(`${i}-${qi}`)).length;
                const allDone = phaseQuestions.length > 0 && completedCount === phaseQuestions.length;
                return (
                  <button
                    key={i}
                    onClick={() => setActivePhaseIdx(i)}
                    className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      activePhaseIdx === i
                        ? 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30'
                        : allDone
                        ? 'bg-green-500/10 text-green-400/60 border border-green-500/20'
                        : 'text-white/40 hover:text-white/60 border border-transparent'
                    }`}
                  >
                    {i + 1}. {phase.name}
                    {allDone && <span className="ml-1">&#10003;</span>}
                  </button>
                );
              })}
            </div>

            {/* Active phase questions */}
            {templatePhases[activePhaseIdx] && (
              <div className="p-3 rounded-lg border bg-[#C9A84C]/5 border-[#C9A84C]/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#C9A84C]">
                    {templatePhases[activePhaseIdx].name}
                  </span>
                  <span className="text-[10px] text-white/30">
                    ~{templatePhases[activePhaseIdx].duration_minutes} min
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {(templatePhases[activePhaseIdx].questions || []).map((q, qi) => {
                    const qKey = `${activePhaseIdx}-${qi}`;
                    const done = checkedQuestions.has(qKey);
                    return (
                      <li
                        key={qi}
                        className={`flex items-start gap-2 text-xs cursor-pointer group ${done ? 'opacity-40' : ''}`}
                        onClick={() => toggleQuestion(qKey)}
                      >
                        <span className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                          done
                            ? 'bg-green-500/30 border-green-500/50 text-green-300'
                            : 'border-white/20 group-hover:border-white/40'
                        }`}>
                          {done && <span className="text-[8px]">&#10003;</span>}
                        </span>
                        <span className={`text-white/70 leading-relaxed ${done ? 'line-through' : ''}`}>
                          {q}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Brand audit guidance prompt */}
        {brandAuditMode && auditNextQuestion && callActive && (
          <div className="p-3 rounded-lg border bg-teal/10 text-teal border-teal/20">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                ?
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs opacity-60 mb-1 uppercase tracking-wider">
                  Audit &middot; Next Question
                </div>
                <p className="text-sm leading-relaxed">{auditNextQuestion}</p>
              </div>
            </div>
          </div>
        )}

        {!callActive && !hasPhases && (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">AI guidance will appear here once the call starts.</p>
          </div>
        )}

        {!callActive && hasPhases && (
          <div className="text-center py-6">
            <p className="text-white/50 text-sm mb-1">Template loaded with {templatePhases.length} phases</p>
            <p className="text-white/30 text-xs">Join the call to see guided questions.</p>
          </div>
        )}

        {callActive && activeGuidance.length === 0 && !hasPhases && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full bg-[#1E6B63]/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-[#1E6B63] text-lg">&#x1F3AF;</span>
            </div>
            {transcriptCount > 0 ? (
              <>
                <p className="text-white/50 text-sm">Transcribing... ({transcriptCount} segments)</p>
                <p className="text-white/30 text-xs mt-1">AI suggestions will appear as the conversation progresses.</p>
              </>
            ) : (
              <p className="text-white/40 text-sm">Listening... AI suggestions will appear as the conversation progresses.</p>
            )}
          </div>
        )}

        {activeGuidance.map((item) => (
          <div
            key={item.id}
            className={`p-2 md:p-3 rounded-lg border ${GUIDANCE_COLORS[item.guidanceType] || GUIDANCE_COLORS.general}`}
          >
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-cream-warm/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {GUIDANCE_ICONS[item.guidanceType] || 'i'}
              </span>
              <div className="flex-1 min-w-0">
                {item.frameworkPhase && (
                  <div className="text-xs opacity-60 mb-1 uppercase tracking-wider">
                    {item.frameworkPhase}
                    {item.frameworkStep && ` \u00B7 ${item.frameworkStep}`}
                  </div>
                )}
                <p className="text-sm leading-relaxed">{item.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
