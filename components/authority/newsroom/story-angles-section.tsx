'use client';

interface StoryAngle {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  newsworthiness: number;
}

interface StoryAnglesSectionProps {
  storyAngles: StoryAngle[];
  primaryColor?: string;
}

export function StoryAnglesSection({ storyAngles, primaryColor = '#14b8a6' }: StoryAnglesSectionProps) {
  if (storyAngles.length === 0) return null;

  return (
    <section id="story-angles" className="py-16 md:py-20 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-stone/40 mb-3 block">
            Pitch Ideas
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-charcoal mb-3">
            Story Angles
          </h2>
          <p className="text-xs sm:text-sm text-stone/50 max-w-md mx-auto">
            Ready-made angles for journalists and media professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {storyAngles.map((angle) => (
            <div
              key={angle.id}
              className="group relative p-5 sm:p-6 bg-white rounded-2xl border border-stone/8 transition-all duration-300 hover:shadow-lg hover:border-stone/15 hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Left accent bar */}
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-r-full transition-all duration-300 group-hover:w-1.5"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="pl-3">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                  >
                    {angle.category.replace(/_/g, ' ')}
                  </span>
                  <div className="flex gap-0.5" aria-label={`Newsworthiness: ${angle.newsworthiness} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className="w-3 h-3"
                        viewBox="0 0 20 20"
                        fill={i < angle.newsworthiness ? primaryColor : '#e5e7eb'}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-charcoal mb-2 leading-snug">{angle.title}</h3>
                {angle.summary && (
                  <p className="text-xs text-stone/50 leading-relaxed line-clamp-3">{angle.summary}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
