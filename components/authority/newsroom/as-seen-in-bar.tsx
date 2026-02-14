'use client';

interface AsSeenInBarProps {
  outlets: string[];
}

export function AsSeenInBar({ outlets }: AsSeenInBarProps) {
  if (outlets.length === 0) return null;

  return (
    <section className="py-8 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">
          As Featured In
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {outlets.map((outlet) => (
            <span
              key={outlet}
              className="text-sm font-semibold text-gray-600"
            >
              {outlet}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
