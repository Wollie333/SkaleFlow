'use client';

import { cn, truncate } from '@/lib/utils';
import { ComplianceBadge } from './compliance-badge';
import { SparklesIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface CreativeCardProps {
  creative: any;
  onClick?: () => void;
}

const formatLabels: Record<string, string> = {
  single_image: 'Single Image',
  single_video: 'Single Video',
  carousel: 'Carousel',
  collection: 'Collection',
  in_feed: 'In-Feed',
  topview: 'TopView',
  spark_ad: 'Spark Ad',
};

export function CreativeCard({ creative, onClick }: CreativeCardProps) {
  const hasMedia = creative.media_urls && creative.media_urls.length > 0;
  const firstMedia = hasMedia ? creative.media_urls[0] : null;
  const isVideo = firstMedia && (firstMedia.endsWith('.mp4') || firstMedia.endsWith('.webm') || firstMedia.endsWith('.mov'));

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-teal/8 overflow-hidden transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-dark/5',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Media Preview */}
      <div className="relative w-full aspect-video bg-cream-warm/30 overflow-hidden">
        {hasMedia ? (
          isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-charcoal/5">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[16px] border-l-teal border-y-[10px] border-y-transparent ml-1" />
              </div>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={firstMedia}
              alt="Ad creative"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="w-10 h-10 text-stone/30" />
          </div>
        )}

        {/* Format Badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-charcoal/70 text-white text-[10px] font-medium backdrop-blur-sm">
            {formatLabels[creative.ad_format] || creative.ad_format || 'Unknown'}
          </span>
        </div>

        {/* AI Generated Indicator */}
        {creative.ai_generated && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal/80 text-cream text-[10px] font-medium backdrop-blur-sm">
              <SparklesIcon className="w-3 h-3" />
              AI
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Headline */}
        {creative.headline && (
          <h4 className="text-sm font-semibold text-charcoal line-clamp-1">
            {creative.headline}
          </h4>
        )}

        {/* Primary Text */}
        {creative.primary_text && (
          <p className="text-xs text-stone line-clamp-2 leading-relaxed">
            {truncate(creative.primary_text, 120)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-stone/10">
          <ComplianceBadge
            status={creative.compliance_status || 'pending'}
            issueCount={creative.compliance_issues?.length}
          />
          {creative.name && (
            <span className="text-[10px] text-stone truncate ml-2 max-w-[120px]">
              {creative.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
