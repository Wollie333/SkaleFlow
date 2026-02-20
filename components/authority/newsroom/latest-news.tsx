'use client';

interface Placement {
  id: string;
  opportunity_name: string;
  target_outlet: string | null;
  category: string;
  reach_tier: string;
  published_at: string | null;
  live_url: string | null;
  confirmed_format: string | null;
  engagement_type: string;
}

interface PressRelease {
  id: string;
  headline: string;
  subtitle: string | null;
  body_content: string;
  published_at: string | null;
}

interface LatestNewsProps {
  placements: Placement[];
  pressReleases: PressRelease[];
  primaryColor?: string;
}

export function LatestNews({ placements, pressReleases, primaryColor = '#14b8a6' }: LatestNewsProps) {
  const hasContent = placements.length > 0 || pressReleases.length > 0;

  if (!hasContent) {
    return (
      <section id="news" className="py-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-serif font-bold text-charcoal mb-3">Latest News</h2>
          <p className="text-stone">No press coverage yet. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="news" className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-serif font-bold text-charcoal mb-8 text-center">Latest News</h2>

        {/* Press Releases */}
        {pressReleases.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Press Releases</h3>
            <div className="space-y-4">
              {pressReleases.map((pr) => (
                <article key={pr.id} className="p-5 bg-cream-warm border border-gray-100 rounded-xl hover:border-stone/10 transition-colors">
                  <h4 className="text-lg font-semibold text-charcoal mb-1">{pr.headline}</h4>
                  {pr.subtitle && <p className="text-sm text-stone mb-2">{pr.subtitle}</p>}
                  <p className="text-sm text-stone line-clamp-3">{pr.body_content}</p>
                  {pr.published_at && (
                    <p className="text-xs text-gray-400 mt-2">{new Date(pr.published_at).toLocaleDateString()}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Media Placements */}
        {placements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Media Coverage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {placements.map((p) => (
                <article key={p.id} className="p-4 bg-cream-warm border border-gray-100 rounded-xl hover:border-stone/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-charcoal truncate">{p.opportunity_name}</h4>
                      {p.target_outlet && (
                        <p className="text-xs font-medium mt-0.5" style={{ color: primaryColor }}>{p.target_outlet}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-stone">
                          {p.category.replace(/_/g, ' ')}
                        </span>
                        {p.confirmed_format && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-stone">
                            {p.confirmed_format.replace(/_/g, ' ')}
                          </span>
                        )}
                        {p.engagement_type === 'paid' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                            Paid Partnership
                          </span>
                        )}
                      </div>
                    </div>
                    {p.live_url && (
                      <a
                        href={p.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                        style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                      >
                        Read
                      </a>
                    )}
                  </div>
                  {p.published_at && (
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(p.published_at).toLocaleDateString()}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
