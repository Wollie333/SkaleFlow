'use client';

import type { GuidanceItem } from './call-room';

interface CopilotPanelProps {
  guidance: GuidanceItem[];
  callActive: boolean;
  transcriptCount?: number;
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
  general: 'bg-white/10 text-white/70 border-white/20',
};

export function CopilotPanel({ guidance, callActive, transcriptCount = 0 }: CopilotPanelProps) {
  const activeGuidance = guidance.filter(g => !g.wasDismissed);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
          AI Co-Pilot
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!callActive && (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">AI guidance will appear here once the call starts.</p>
          </div>
        )}

        {callActive && activeGuidance.length === 0 && (
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
            className={`p-3 rounded-lg border ${GUIDANCE_COLORS[item.guidanceType] || GUIDANCE_COLORS.general}`}
          >
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
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
