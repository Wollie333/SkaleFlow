'use client';

interface AsSeenInBarProps {
  outlets: string[];
  darkBase?: string;
}

export function AsSeenInBar({ outlets, darkBase = '#0a0f0e' }: AsSeenInBarProps) {
  if (outlets.length === 0) return null;

  return (
    <section className="py-10 px-5">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-center mb-5" style={{ color: `${darkBase}40` }}>
          As Featured In
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 md:gap-x-4">
          {outlets.map((outlet, i) => (
            <span key={outlet} className="flex items-center gap-3 md:gap-4">
              <span className="text-sm sm:text-base md:text-lg font-serif font-semibold whitespace-nowrap" style={{ color: `${darkBase}99` }}>
                {outlet}
              </span>
              {i < outlets.length - 1 && (
                <span className="hidden sm:block w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: `${darkBase}20` }} />
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
