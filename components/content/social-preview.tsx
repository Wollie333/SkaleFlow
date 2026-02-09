'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SocialPlatform } from '@/types/database';

interface SocialPreviewProps {
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  targetUrl?: string;
  userName?: string;
  userAvatar?: string;
}

interface SocialPreviewTabsProps {
  platforms: SocialPlatform[];
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  targetUrl?: string;
  userName?: string;
  userAvatar?: string;
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  twitter: 280,
  tiktok: 2200,
  youtube: 5000,
};

function AvatarPlaceholder({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="rounded-full bg-teal/20 text-teal flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function MediaPreview({ urls, aspect = 'square' }: { urls: string[]; aspect?: 'square' | 'wide' }) {
  if (urls.length === 0) return null;
  return (
    <div className={cn(
      'bg-stone/5 border border-stone/10 rounded-lg overflow-hidden flex items-center justify-center',
      aspect === 'square' ? 'aspect-square' : 'aspect-video'
    )}>
      {urls[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urls[0]} alt="Post media" className="w-full h-full object-cover" />
      ) : (
        <div className="text-stone/40 text-xs">Media preview</div>
      )}
    </div>
  );
}

function formatCaption(caption: string, hashtags: string[]) {
  const hashtagStr = hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '';
  return caption + hashtagStr;
}

function CharCount({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const color = pct > 100 ? 'text-red-500' : pct > 80 ? 'text-amber-500' : 'text-stone';
  return (
    <div className={cn('text-xs text-right mt-1', color)}>
      {current.toLocaleString()} / {max.toLocaleString()}
    </div>
  );
}

// ─── LinkedIn Preview ───────────────────────────────────────────────────
function LinkedInPreview({ caption, hashtags, mediaUrls, targetUrl, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'Your Name';

  return (
    <div className="bg-white rounded-lg border border-stone/15 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-start gap-2.5">
        <AvatarPlaceholder name={displayName} size={48} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charcoal leading-tight">{displayName}</p>
          <p className="text-xs text-stone">1st &middot; Just now</p>
        </div>
      </div>
      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-sm text-charcoal whitespace-pre-wrap break-words line-clamp-5">
          {fullText || <span className="text-stone/50 italic">Your caption will appear here...</span>}
        </p>
      </div>
      {/* Media or link preview */}
      {mediaUrls.length > 0 ? (
        <MediaPreview urls={mediaUrls} aspect="wide" />
      ) : targetUrl ? (
        <div className="mx-3 mb-3 border border-stone/15 rounded-lg overflow-hidden">
          <div className="bg-stone/5 aspect-video flex items-center justify-center">
            <span className="text-xs text-stone/40">Link preview</span>
          </div>
          <div className="p-2.5 bg-stone/5">
            <p className="text-xs text-stone truncate">{targetUrl}</p>
          </div>
        </div>
      ) : null}
      {/* Engagement bar */}
      <div className="px-3 py-1.5 border-t border-stone/10">
        <div className="flex items-center gap-1 text-xs text-stone">
          <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px]">&#128077;</span>
          <span>0</span>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-stone/10 flex items-center justify-around">
        {['Like', 'Comment', 'Repost', 'Send'].map(action => (
          <button key={action} className="text-xs text-stone font-medium hover:bg-stone/5 px-3 py-1.5 rounded">
            {action}
          </button>
        ))}
      </div>
      <CharCount current={fullText.length} max={3000} />
    </div>
  );
}

// ─── Facebook Preview ───────────────────────────────────────────────────
function FacebookPreview({ caption, hashtags, mediaUrls, targetUrl, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'Your Page';

  return (
    <div className="bg-white rounded-lg border border-stone/15 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-start gap-2.5">
        <AvatarPlaceholder name={displayName} size={40} />
        <div>
          <p className="text-sm font-semibold text-charcoal">{displayName}</p>
          <p className="text-xs text-stone flex items-center gap-1">Just now &middot; <span className="inline-block w-3 h-3">&#127760;</span></p>
        </div>
      </div>
      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-sm text-charcoal whitespace-pre-wrap break-words line-clamp-5">
          {fullText || <span className="text-stone/50 italic">Your caption will appear here...</span>}
        </p>
      </div>
      {/* Media or link */}
      {mediaUrls.length > 0 ? (
        <MediaPreview urls={mediaUrls} aspect="wide" />
      ) : targetUrl ? (
        <div className="border-t border-b border-stone/10">
          <div className="bg-stone/5 aspect-video flex items-center justify-center">
            <span className="text-xs text-stone/40">Link preview</span>
          </div>
          <div className="p-2.5 bg-stone/5">
            <p className="text-xs text-stone truncate">{targetUrl}</p>
          </div>
        </div>
      ) : null}
      {/* Engagement */}
      <div className="px-3 py-2 border-t border-stone/10 flex items-center justify-around">
        {['Like', 'Comment', 'Share'].map(action => (
          <button key={action} className="text-xs text-stone font-medium hover:bg-stone/5 px-4 py-1.5 rounded flex items-center gap-1">
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Instagram Preview ──────────────────────────────────────────────────
function InstagramPreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'yourpage';

  return (
    <div className="bg-white rounded-lg border border-stone/15 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-center gap-2.5">
        <AvatarPlaceholder name={displayName} size={32} />
        <p className="text-sm font-semibold text-charcoal flex-1">{displayName}</p>
        <span className="text-stone text-lg">&middot;&middot;&middot;</span>
      </div>
      {/* Media (square) */}
      <div className="bg-stone/5 aspect-square flex items-center justify-center">
        {mediaUrls.length > 0 && mediaUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrls[0]} alt="Post media" className="w-full h-full object-cover" />
        ) : (
          <span className="text-stone/30 text-sm">Image / Reel</span>
        )}
      </div>
      {/* Action bar */}
      <div className="px-3 py-2 flex items-center gap-4">
        <span className="text-lg">&#9825;</span>
        <span className="text-lg">&#128172;</span>
        <span className="text-lg">&#9993;</span>
        <span className="flex-1" />
        <span className="text-lg">&#9745;</span>
      </div>
      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-sm text-charcoal">
          <span className="font-semibold mr-1">{displayName}</span>
          <span className="whitespace-pre-wrap break-words line-clamp-3">
            {fullText || <span className="text-stone/50 italic">Caption here...</span>}
          </span>
        </p>
      </div>
      <CharCount current={fullText.length} max={2200} />
    </div>
  );
}

// ─── Twitter/X Preview ──────────────────────────────────────────────────
function TwitterPreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'Your Name';
  const handle = '@' + displayName.toLowerCase().replace(/\s+/g, '');

  return (
    <div className="bg-white rounded-lg border border-stone/15 shadow-sm overflow-hidden p-3">
      <div className="flex gap-2.5">
        <AvatarPlaceholder name={displayName} size={40} />
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-charcoal">{displayName}</span>
            <span className="text-sm text-stone">{handle}</span>
            <span className="text-sm text-stone">&middot; now</span>
          </div>
          {/* Tweet text */}
          <p className="text-sm text-charcoal whitespace-pre-wrap break-words mt-0.5">
            {fullText || <span className="text-stone/50 italic">Your post will appear here...</span>}
          </p>
          {/* Media */}
          {mediaUrls.length > 0 && (
            <div className="mt-2">
              <MediaPreview urls={mediaUrls} aspect="wide" />
            </div>
          )}
          {/* Action bar */}
          <div className="flex items-center justify-between mt-3 text-stone max-w-[300px]">
            {['Reply', 'Repost', 'Like', 'Views', 'Share'].map(a => (
              <span key={a} className="text-xs">{a}</span>
            ))}
          </div>
        </div>
      </div>
      <CharCount current={fullText.length} max={280} />
    </div>
  );
}

// ─── TikTok Preview ─────────────────────────────────────────────────────
function TikTokPreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'yourpage';

  return (
    <div className="bg-charcoal rounded-lg overflow-hidden relative" style={{ aspectRatio: '9/16', maxHeight: 400 }}>
      {/* Video area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {mediaUrls.length > 0 && mediaUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrls[0]} alt="Video" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/20 text-sm">Video preview</span>
        )}
      </div>
      {/* Overlay - bottom caption */}
      <div className="absolute bottom-0 left-0 right-10 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-white text-xs font-semibold mb-1">@{displayName}</p>
        <p className="text-white/90 text-xs whitespace-pre-wrap break-words line-clamp-3">
          {fullText || <span className="text-white/40 italic">Caption here...</span>}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-white/70 text-[10px]">
          <span>&#9835;</span>
          <span>Original sound - {displayName}</span>
        </div>
      </div>
      {/* Right sidebar icons */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
        {[
          { icon: '&#9825;', label: '0' },
          { icon: '&#128172;', label: '0' },
          { icon: '&#9733;', label: '0' },
          { icon: '&#8614;', label: 'Share' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-white text-lg" dangerouslySetInnerHTML={{ __html: item.icon }} />
            <span className="text-white/70 text-[10px]">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-1 right-1">
        <CharCount current={fullText.length} max={2200} />
      </div>
    </div>
  );
}

// ─── YouTube Preview ────────────────────────────────────────────────────
function YouTubePreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'Your Channel';

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-stone/10">
      {/* Video thumbnail */}
      <div className="aspect-video bg-charcoal flex items-center justify-center relative">
        {mediaUrls.length > 0 && mediaUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrls[0]} alt="Video" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/20 text-sm">Video thumbnail</span>
        )}
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-11 bg-red-600 rounded-xl flex items-center justify-center opacity-80">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      {/* Title and channel info */}
      <div className="p-3 space-y-2">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-stone/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-stone">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-charcoal line-clamp-2 leading-tight">
              {fullText || <span className="text-stone italic">Video title will appear here...</span>}
            </p>
            <p className="text-xs text-stone mt-1">{displayName}</p>
            <p className="text-xs text-stone">0 views</p>
          </div>
        </div>
        <CharCount current={fullText.length} max={5000} />
      </div>
    </div>
  );
}

// ─── Single Platform Preview (exported) ────────────────────────────────
export function SocialPreview(props: SocialPreviewProps) {
  switch (props.platform) {
    case 'linkedin':
      return <LinkedInPreview {...props} />;
    case 'facebook':
      return <FacebookPreview {...props} />;
    case 'instagram':
      return <InstagramPreview {...props} />;
    case 'twitter':
      return <TwitterPreview {...props} />;
    case 'tiktok':
      return <TikTokPreview {...props} />;
    case 'youtube':
      return <YouTubePreview {...props} />;
    default:
      return <LinkedInPreview {...props} />;
  }
}

// ─── Tabbed Preview (exported) ─────────────────────────────────────────
export function SocialPreviewTabs({ platforms, caption, hashtags, mediaUrls, targetUrl, userName, userAvatar }: SocialPreviewTabsProps) {
  const activePlatforms = platforms.length > 0 ? platforms : (['linkedin'] as SocialPlatform[]);
  const [selected, setSelected] = useState<SocialPlatform>(activePlatforms[0]);

  // If selected platform is not in list, reset to first
  const currentPlatform = activePlatforms.includes(selected) ? selected : activePlatforms[0];

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 bg-stone/5 rounded-lg p-1">
        {activePlatforms.map(p => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              currentPlatform === p
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-stone hover:text-charcoal'
            )}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Preview */}
      <SocialPreview
        platform={currentPlatform}
        caption={caption}
        hashtags={hashtags}
        mediaUrls={mediaUrls}
        targetUrl={targetUrl}
        userName={userName}
        userAvatar={userAvatar}
      />

      {/* Char limit indicator */}
      <div className="text-xs text-stone text-center">
        {PLATFORM_LABELS[currentPlatform]} limit: {PLATFORM_CHAR_LIMITS[currentPlatform].toLocaleString()} characters
      </div>
    </div>
  );
}
