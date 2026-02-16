'use client';

interface SummaryProps {
  summary: {
    summary_text: string | null;
    key_points: string[];
    decisions_made: string[];
    objections_raised: Array<{ objection: string; response: string; resolved: boolean }>;
    next_steps: Array<{ action: string; owner: string; deadline: string }>;
  };
}

export function CallSummary({ summary }: SummaryProps) {
  return (
    <div className="space-y-6">
      {/* Narrative Summary */}
      {summary.summary_text && (
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Summary</h3>
          <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{summary.summary_text}</p>
        </div>
      )}

      {/* Key Points */}
      {summary.key_points?.length > 0 && (
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Key Points</h3>
          <ul className="space-y-2">
            {summary.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                <span className="w-5 h-5 rounded-full bg-teal/10 text-teal text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decisions */}
      {summary.decisions_made?.length > 0 && (
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Decisions Made</h3>
          <ul className="space-y-1.5">
            {summary.decisions_made.map((d, i) => (
              <li key={i} className="text-sm text-charcoal flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span> {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Objections */}
      {summary.objections_raised?.length > 0 && (
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Objections Raised</h3>
          <div className="space-y-3">
            {summary.objections_raised.map((obj, i) => (
              <div key={i} className="border-l-2 border-orange-300 pl-3">
                <p className="text-sm font-medium text-charcoal">&ldquo;{obj.objection}&rdquo;</p>
                <p className="text-sm text-stone mt-1">Response: {obj.response}</p>
                <span className={`text-xs ${obj.resolved ? 'text-green-600' : 'text-orange-600'}`}>
                  {obj.resolved ? 'Resolved' : 'Unresolved'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {summary.next_steps?.length > 0 && (
        <div className="bg-white rounded-xl border border-stone/10 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Next Steps</h3>
          <div className="space-y-2">
            {summary.next_steps.map((step, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-charcoal">{step.action}</span>
                <div className="flex items-center gap-2 text-xs text-stone">
                  <span className="px-2 py-0.5 bg-cream rounded capitalize">{step.owner}</span>
                  {step.deadline && <span>{step.deadline}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
