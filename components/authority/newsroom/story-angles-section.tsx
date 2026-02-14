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
    <section id="story-angles" className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2 text-center">Story Angles</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Ready-made angles for journalists and media professionals
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storyAngles.map((angle) => (
            <div
              key={angle.id}
              className="p-5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {angle.category.replace(/_/g, ' ')}
                </span>
                <div className="flex gap-0.5 ml-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: i < angle.newsworthiness ? primaryColor : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{angle.title}</h3>
              {angle.summary && (
                <p className="text-xs text-gray-500 line-clamp-3">{angle.summary}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
