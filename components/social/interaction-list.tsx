'use client';

import { InteractionCard } from './interaction-card';

interface InteractionListProps {
  interactions: any[];
  selectedInteraction: any | null;
  onInteractionClick: (interaction: any) => void;
  onMarkAsRead: (id: string) => void;
}

export function InteractionList({
  interactions,
  selectedInteraction,
  onInteractionClick,
  onMarkAsRead,
}: InteractionListProps) {
  if (interactions.length === 0) {
    return (
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-12 text-center">
        <p className="text-stone text-sm">No interactions found</p>
        <p className="text-stone/60 text-xs mt-2">
          Your social media interactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction) => (
        <InteractionCard
          key={interaction.id}
          interaction={interaction}
          isSelected={selectedInteraction?.id === interaction.id}
          onClick={() => onInteractionClick(interaction)}
          onMarkAsRead={() => onMarkAsRead(interaction.id)}
        />
      ))}
    </div>
  );
}
