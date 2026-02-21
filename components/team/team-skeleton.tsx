'use client';

export function MemberCardSkeleton() {
  return (
    <div className="bg-cream-warm rounded-xl border border-teal/[0.08] shadow-[0_2px_12px_rgba(15,31,29,0.03)] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-stone/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-stone/10 rounded w-32" />
          <div className="h-3 bg-stone/8 rounded w-48" />
          <div className="h-3 bg-stone/8 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function PermissionsGridSkeleton() {
  return (
    <div className="bg-cream-warm rounded-xl border border-teal/[0.08] p-6 animate-pulse space-y-4">
      <div className="h-5 bg-stone/10 rounded w-40" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-6">
          <div className="h-4 bg-stone/10 rounded w-32" />
          <div className="flex gap-4 flex-1">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="h-6 w-6 bg-stone/10 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-stone/10 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-stone/10 rounded w-3/4" />
            <div className="h-3 bg-stone/8 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
