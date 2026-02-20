'use client';

import { useRouter } from 'next/navigation';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { CATEGORY_CONFIG } from '@/lib/authority/constants';

interface PipelineCard {
  id: string;
  opportunity_name: string;
  category: string;
  created_at: string;
  published_at: string | null;
  authority_pipeline_stages?: {
    name: string;
    slug: string;
    color: string;
  } | null;
}

interface ContactPipelineTabProps {
  cards: PipelineCard[];
}

export function ContactPipelineTab({ cards }: ContactPipelineTabProps) {
  const router = useRouter();

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <RectangleStackIcon className="w-10 h-10 mx-auto text-stone/30 mb-3" />
        <p className="text-sm text-stone">No pipeline cards linked to this contact</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const stage = card.authority_pipeline_stages;
        const categoryConfig = CATEGORY_CONFIG[card.category as keyof typeof CATEGORY_CONFIG];

        return (
          <button
            key={card.id}
            onClick={() => router.push(`/authority?card=${card.id}`)}
            className="w-full text-left p-4 bg-cream-warm border border-stone/10 rounded-xl hover:border-teal/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal truncate">{card.opportunity_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {categoryConfig && (
                    <span className="text-[10px] font-medium text-stone">{categoryConfig.label}</span>
                  )}
                  {stage && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: stage.color, backgroundColor: `${stage.color}20` }}
                    >
                      {stage.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-stone">
                  {new Date(card.created_at).toLocaleDateString()}
                </p>
                {card.published_at && (
                  <p className="text-[10px] text-green-600">Published</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
