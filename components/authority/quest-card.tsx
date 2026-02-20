'use client';

import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { AUTHORITY_TIERS } from '@/lib/authority/constants';
import type { QuestRequirement } from '@/lib/authority/types';

interface QuestCardProps {
  questName: string;
  tier: number;
  description: string | null;
  requirements: QuestRequirement[];
  status: string;
  progressPercentage: number;
  isCurrent: boolean;
  completedAt: string | null;
}

export function QuestCard({
  questName,
  tier,
  description,
  requirements,
  status,
  progressPercentage,
  isCurrent,
  completedAt,
}: QuestCardProps) {
  const tierConfig = AUTHORITY_TIERS.find(t => t.tier === tier) || AUTHORITY_TIERS[0];
  const isCompleted = status === 'completed';

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isCurrent
          ? 'border-teal bg-teal/5 shadow-sm'
          : isCompleted
          ? 'border-green-200 bg-green-50/30'
          : 'border-stone/10 bg-cream-warm opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              color: tierConfig.color,
              backgroundColor: `${tierConfig.color}15`,
            }}
          >
            Tier {tier}
          </span>
          <h3 className="text-sm font-serif font-semibold text-charcoal">{questName}</h3>
        </div>
        {isCompleted && (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        )}
        {isCurrent && !isCompleted && (
          <span className="text-[10px] font-medium text-teal bg-teal/10 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-stone mb-3">{description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-stone mb-0.5">
          <span>{progressPercentage}% complete</span>
          {isCompleted && completedAt && (
            <span className="flex items-center gap-0.5">
              <ClockIcon className="w-3 h-3" />
              {new Date(completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="h-2 bg-cream-warm rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-teal'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-1.5">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                req.completed
                  ? 'bg-green-500'
                  : 'border border-stone/20 bg-cream-warm'
              }`}
            >
              {req.completed && (
                <CheckCircleIcon className="w-3 h-3 text-white" />
              )}
            </div>
            <span className={`text-xs ${req.completed ? 'text-stone line-through' : 'text-charcoal'}`}>
              {req.label}
            </span>
            <span className="text-[10px] text-stone ml-auto">
              {req.current}/{req.target}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
