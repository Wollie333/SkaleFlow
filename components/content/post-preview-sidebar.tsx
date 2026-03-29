'use client';

import { cn } from '@/lib/utils';
import { XMarkIcon, PencilIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { ContentStatus } from '@/types/database';

interface PostPreviewSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    topic: string | null;
    hook: string | null;
    script_body: string | null;
    cta: string | null;
    caption: string | null;
    hashtags: string[] | null;
    platforms: string[];
    format: string;
    status: ContentStatus;
    scheduled_date: string;
    scheduled_time: string | null;
    media_urls?: string[] | null;
  };
  onEdit: (postId: string) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-700',
  instagram: 'bg-pink-600',
  tiktok: 'bg-gray-900',
  youtube: 'bg-red-600',
  x: 'bg-gray-800',
};

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-stone/10 text-stone border-stone/20',
  scripted: 'bg-blue-50 text-blue-700 border-blue-200',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  scheduled: 'bg-teal-50 text-teal-700 border-teal-200',
  published: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export function PostPreviewSidebar({ isOpen, onClose, post, onEdit }: PostPreviewSidebarProps) {
  const formatDate = (dateStr: string, timeStr: string | null) => {
    const date = new Date(dateStr + 'T00:00:00');
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (timeStr) {
      return `${formatted} at ${timeStr}`;
    }
    return formatted;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-dark/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-screen w-full sm:w-[500px] sm:max-w-[90vw] bg-cream border-l border-stone/10 shadow-xl z-50 transform transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="bg-cream border-b border-stone/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-heading-md text-charcoal truncate">Post Preview</h2>
            <p className="text-[10px] sm:text-xs text-stone mt-0.5">
              {post.format.replace(/_/g, ' ')} • {post.platforms.join(', ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 sm:ml-4 p-2 sm:p-2 hover:bg-stone/10 rounded-lg transition-colors touch-manipulation"
          >
            <XMarkIcon className="w-6 h-6 sm:w-5 sm:h-5 text-stone" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status & Schedule Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className={cn('px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border', STATUS_COLORS[post.status] || 'bg-stone/10 text-stone border-stone/20')}>
              {post.status.replace('_', ' ')}
            </span>

            {post.scheduled_date && (
              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-stone">
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">{formatDate(post.scheduled_date, post.scheduled_time)}</span>
              </div>
            )}

            <div className="flex gap-1 sm:gap-2 ml-auto flex-wrap">
              {post.platforms.map(platform => (
                <div
                  key={platform}
                  className={cn(
                    'px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-medium text-white uppercase',
                    PLATFORM_COLORS[platform] || 'bg-stone'
                  )}
                >
                  {platform}
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview - matches post editor exactly */}
          <div className="bg-cream-warm border border-stone/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone/10">
              <span className="text-xs font-medium text-stone uppercase tracking-wider">Preview</span>
            </div>
            <div className="p-4">
              {/* Media preview */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="mb-4">
                  {post.media_urls.length > 1 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {post.media_urls.slice(0, 4).map((url, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-stone/5">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg overflow-hidden bg-stone/5">
                      <img
                        src={post.media_urls[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Preview content - exact same as post editor */}
              {post.hook && (
                <p className="text-sm font-semibold text-charcoal mb-3 leading-relaxed">
                  {post.hook}
                </p>
              )}
              {post.script_body && (
                <div className="text-sm text-charcoal/90 mb-3 whitespace-pre-wrap leading-relaxed">
                  {post.script_body}
                </div>
              )}
              {post.cta && (
                <p className="text-sm font-medium text-teal mb-3">{post.cta}</p>
              )}
              {post.caption && post.caption !== post.script_body && (
                <div className="border-t border-stone/10 pt-3 mt-3">
                  <p className="text-xs text-stone mb-1 font-medium">Caption:</p>
                  <p className="text-sm text-charcoal/80 whitespace-pre-wrap">{post.caption}</p>
                </div>
              )}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-teal">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
              {!post.hook && !post.script_body && !post.caption && (
                <div className="text-center py-8">
                  <PencilIcon className="w-8 h-8 text-stone/20 mx-auto mb-2" />
                  <p className="text-xs text-stone/40">No content yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Edit Button at bottom */}
        <div className="bg-cream border-t border-stone/10 p-4 sm:p-6 shrink-0">
          <button
            onClick={() => onEdit(post.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3 bg-teal hover:bg-teal-dark text-white rounded-lg font-medium transition-colors touch-manipulation"
          >
            <PencilIcon className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">Edit Post</span>
          </button>
        </div>
      </div>
    </>
  );
}
