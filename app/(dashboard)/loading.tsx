export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-stone/10 rounded-lg" />
        <div className="h-10 w-32 bg-stone/10 rounded-lg" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-cream-warm rounded-xl border border-stone/10 p-6 space-y-4">
            <div className="h-4 w-24 bg-stone/10 rounded" />
            <div className="h-8 w-16 bg-stone/10 rounded" />
            <div className="h-3 w-full bg-stone/10 rounded" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="bg-cream-warm rounded-xl border border-stone/10 p-6 space-y-4">
        <div className="h-5 w-36 bg-stone/10 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-4 bg-stone/10 rounded" />
              <div className="h-4 flex-1 bg-stone/10 rounded" />
              <div className="h-4 w-20 bg-stone/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
