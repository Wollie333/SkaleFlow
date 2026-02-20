'use client';

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    value_cents: number;
    status: 'open' | 'won' | 'lost';
    probability: number;
    expected_close_date: string | null;
    crm_contacts?: {
      first_name: string;
      last_name: string;
    } | null;
  };
}

export default function DealCard({ deal }: DealCardProps) {
  function formatCurrency(cents: number): string {
    return `R${(cents / 100).toFixed(2)}`;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'won':
        return 'bg-green-500';
      case 'lost':
        return 'bg-red-500';
      default:
        return 'bg-stone-400';
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-400 border-blue-200';
      case 'won':
        return 'bg-green-500/10 text-green-400 border-green-200';
      case 'lost':
        return 'bg-red-500/10 text-red-400 border-red-200';
      default:
        return 'bg-cream text-charcoal border-stone/10';
    }
  }

  return (
    <div className="bg-cream-warm border border-stone/10 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-dark text-sm line-clamp-2 flex-1">{deal.title}</h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusBadgeColor(
            deal.status
          )}`}
        >
          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
        </span>
      </div>

      {/* Value */}
      <div className="text-xl font-bold text-dark">{formatCurrency(deal.value_cents)}</div>

      {/* Contact */}
      {deal.crm_contacts && (
        <div className="text-sm text-charcoal">
          {deal.crm_contacts.first_name} {deal.crm_contacts.last_name}
        </div>
      )}

      {/* Probability Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-charcoal">
          <span>Probability</span>
          <span className="font-medium">{deal.probability}%</span>
        </div>
        <div className="h-2 bg-cream-warm rounded-full overflow-hidden">
          <div
            className={`h-full ${getStatusColor(deal.status)} transition-all duration-300`}
            style={{ width: `${deal.probability}%` }}
          />
        </div>
      </div>

      {/* Expected Close Date */}
      {deal.expected_close_date && (
        <div className="text-xs text-stone pt-1 border-t border-stone/10">
          Expected close:{' '}
          {new Date(deal.expected_close_date).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}
