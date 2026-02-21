'use client';

interface CallCostPanelProps {
  costData: {
    items: Array<{
      id: string;
      feature: string;
      model: string;
      credits_charged: number;
      provider: string;
      created_at: string;
    }>;
    totalCredits: number;
    guidanceCountFallback: number;
  };
}

function prettifyFeature(f: string): string {
  return f.replace(/_/g, ' ').replace(/^call /, '').replace(/\b\w/g, l => l.toUpperCase());
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CallCostPanel({ costData }: CallCostPanelProps) {
  const { items, totalCredits, guidanceCountFallback } = costData;
  const zarAmount = (totalCredits / 100).toLocaleString('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  });

  // Empty state — no items and no fallback
  if (items.length === 0 && guidanceCountFallback === 0) {
    return (
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5 text-center">
        <p className="text-sm text-stone">No AI usage recorded for this call.</p>
      </div>
    );
  }

  // Fallback state — no granular items but we know copilot was used
  if (items.length === 0 && guidanceCountFallback > 0) {
    return (
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5 text-center space-y-2">
        <p className="text-sm font-medium text-charcoal">
          Estimated {guidanceCountFallback} copilot interaction{guidanceCountFallback !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-stone">
          Detailed per-interaction tracking was added after this call was recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Big number display */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5 text-center">
        <p className="text-4xl font-bold text-teal">{totalCredits.toLocaleString()}</p>
        <p className="text-lg text-stone mt-1">{zarAmount}</p>
        <p className="text-xs text-stone mt-0.5">credits consumed</p>
      </div>

      {/* Breakdown table */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-5">
        <h3 className="text-sm font-semibold text-charcoal mb-3">Usage Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone border-b border-stone/10">
              <th className="pb-2 font-medium">Feature</th>
              <th className="pb-2 font-medium">Model</th>
              <th className="pb-2 font-medium text-right">Credits</th>
              <th className="pb-2 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="even:bg-cream">
                <td className="py-2 text-charcoal">{prettifyFeature(item.feature)}</td>
                <td className="py-2 text-stone">{item.model}</td>
                <td className="py-2 text-charcoal text-right font-medium">{item.credits_charged}</td>
                <td className="py-2 text-stone text-right">{timeAgo(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
