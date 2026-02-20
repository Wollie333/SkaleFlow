'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SocialPlatform, PlacementType } from '@/types/database';

interface SocialPreviewProps {
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  targetUrl?: string;
  userName?: string;
  userAvatar?: string;
  placementType?: PlacementType | null;
}

interface SocialPreviewTabsProps {
  platforms: SocialPlatform[];
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  targetUrl?: string;
  userName?: string;
  userAvatar?: string;
  placements?: PlacementType[];
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
  const hashtagStr = hashtags.length > 0 ? '\n\n' + hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ') : '';
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
    <div className="bg-cream-warm rounded-lg border border-stone/15 shadow-sm overflow-hidden">
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
    <div className="bg-cream-warm rounded-lg border border-stone/15 shadow-sm overflow-hidden">
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
    <div className="bg-cream-warm rounded-lg border border-stone/15 shadow-sm overflow-hidden">
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
    <div className="bg-cream-warm rounded-lg border border-stone/15 shadow-sm overflow-hidden p-3">
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
    <div className="bg-cream-warm rounded-lg overflow-hidden border border-stone/10">
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

// ─── Reel/Short Preview (vertical, 9:16) ──────────────────────────────
function ReelPreview({ caption, hashtags, mediaUrls, userName, platform }: SocialPreviewProps & { platform: SocialPlatform }) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'yourpage';
  const platformLabel = platform === 'facebook' ? 'Facebook Reel' : platform === 'youtube' ? 'YouTube Short' : 'Instagram Reel';

  return (
    <div className="bg-charcoal rounded-lg overflow-hidden relative" style={{ aspectRatio: '9/16', maxHeight: 400 }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {mediaUrls.length > 0 && mediaUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrls[0]} alt="Reel" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/20 text-sm">{platformLabel} preview</span>
        )}
      </div>
      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-10 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-white text-xs font-semibold mb-1">@{displayName}</p>
        <p className="text-white/90 text-xs whitespace-pre-wrap break-words line-clamp-3">
          {fullText || <span className="text-white/40 italic">Caption here...</span>}
        </p>
      </div>
      {/* Right side buttons */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
        {[
          { icon: '&#9825;', label: '0' },
          { icon: '&#128172;', label: '0' },
          { icon: '&#8614;', label: 'Share' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-white text-lg" dangerouslySetInnerHTML={{ __html: item.icon }} />
            <span className="text-white/70 text-[10px]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Story Preview (vertical, 9:16 with story UI) ─────────────────────
function StoryPreview({ caption, hashtags, mediaUrls, userName, platform }: SocialPreviewProps & { platform: SocialPlatform }) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'yourpage';

  return (
    <div className="bg-charcoal rounded-lg overflow-hidden relative" style={{ aspectRatio: '9/16', maxHeight: 400 }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {mediaUrls.length > 0 && mediaUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrls[0]} alt="Story" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/20 text-sm">{PLATFORM_LABELS[platform]} Story</span>
        )}
      </div>
      {/* Story progress bar */}
      <div className="absolute top-2 left-2 right-2 flex gap-1">
        <div className="flex-1 h-0.5 bg-cream-warm/60 rounded-full" />
      </div>
      {/* User info top */}
      <div className="absolute top-5 left-3 right-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-cream-warm/20 flex items-center justify-center text-white text-xs font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-white text-xs font-semibold">{displayName}</span>
        <span className="text-white/60 text-xs">Just now</span>
      </div>
      {/* Bottom text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
        <p className="text-white/90 text-xs whitespace-pre-wrap break-words line-clamp-2 text-center">
          {fullText.slice(0, 250) || <span className="text-white/40 italic">Story text</span>}
        </p>
        {/* Swipe up CTA */}
        <div className="mt-3 flex flex-col items-center">
          <svg className="w-4 h-4 text-white/70 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-white/70 text-[10px]">Swipe up</span>
        </div>
      </div>
    </div>
  );
}

// ─── LinkedIn Article Preview ──────────────────────────────────────────
function LinkedInArticlePreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const displayName = userName || 'Your Name';
  const title = caption.split('\n')[0] || 'Article Title';
  const excerpt = caption.split('\n').slice(1).join(' ').slice(0, 200) || 'Article excerpt will appear here...';

  return (
    <div className="bg-cream-warm rounded-lg border border-stone/15 shadow-sm overflow-hidden">
      <div className="p-3 flex items-start gap-2.5">
        <AvatarPlaceholder name={displayName} size={48} />
        <div>
          <p className="text-sm font-semibold text-charcoal">{displayName}</p>
          <p className="text-xs text-stone">Published an article</p>
        </div>
      </div>
      {/* Article card */}
      <div className="mx-3 mb-3 border border-stone/15 rounded-lg overflow-hidden">
        <div className="bg-stone/5 aspect-[2/1] flex items-center justify-center">
          {mediaUrls.length > 0 && mediaUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrls[0]} alt="Article" className="w-full h-full object-cover" />
          ) : (
            <span className="text-stone/30 text-sm">Article cover</span>
          )}
        </div>
        <div className="p-3 bg-stone/5">
          <p className="text-sm font-bold text-charcoal line-clamp-2">{title}</p>
          <p className="text-xs text-stone mt-1 line-clamp-2">{excerpt}</p>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-stone/10 flex items-center justify-around">
        {['Like', 'Comment', 'Repost', 'Send'].map(action => (
          <button key={action} className="text-xs text-stone font-medium px-3 py-1.5 rounded">{action}</button>
        ))}
      </div>
    </div>
  );
}

// ─── LinkedIn Document Preview ─────────────────────────────────────────
function LinkedInDocumentPreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'Your Name';

  return (
    <div className="bg-cream-warm rounded-lg border border-stone/15 shadow-sm overflow-hidden">
      <div className="p-3 flex items-start gap-2.5">
        <AvatarPlaceholder name={displayName} size={48} />
        <div>
          <p className="text-sm font-semibold text-charcoal">{displayName}</p>
          <p className="text-xs text-stone">1st &middot; Just now</p>
        </div>
      </div>
      <div className="px-3 pb-2">
        <p className="text-sm text-charcoal whitespace-pre-wrap break-words line-clamp-3">{fullText}</p>
      </div>
      {/* Document carousel mockup */}
      <div className="mx-3 mb-3 border border-stone/15 rounded-lg overflow-hidden bg-stone/5">
        <div className="aspect-[4/3] flex items-center justify-center relative">
          {mediaUrls.length > 0 && mediaUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrls[0]} alt="Document" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="w-12 h-14 mx-auto border-2 border-stone/30 rounded bg-cream-warm flex items-center justify-center mb-2">
                <span className="text-stone/40 text-xs">PDF</span>
              </div>
              <span className="text-stone/30 text-xs">Document carousel</span>
            </div>
          )}
          {/* Slide indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-teal" />
            <div className="w-2 h-2 rounded-full bg-stone/30" />
            <div className="w-2 h-2 rounded-full bg-stone/30" />
          </div>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-stone/10 flex items-center justify-around">
        {['Like', 'Comment', 'Repost', 'Send'].map(action => (
          <button key={action} className="text-xs text-stone font-medium px-3 py-1.5 rounded">{action}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Twitter Thread Preview ────────────────────────────────────────────
function TwitterThreadPreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'Your Name';
  const handle = '@' + displayName.toLowerCase().replace(/\s+/g, '');
  // Split into tweet-sized chunks (280 chars)
  const tweets: string[] = [];
  let remaining = fullText;
  while (remaining.length > 0) {
    if (remaining.length <= 280) {
      tweets.push(remaining);
      break;
    }
    const chunk = remaining.slice(0, 270);
    const lastSpace = chunk.lastIndexOf(' ');
    tweets.push(remaining.slice(0, lastSpace > 200 ? lastSpace : 270));
    remaining = remaining.slice(lastSpace > 200 ? lastSpace + 1 : 270);
    if (tweets.length >= 5) { tweets.push('...'); break; }
  }

  return (
    <div className="space-y-0">
      {tweets.map((tweet, i) => (
        <div key={i} className="bg-cream-warm border border-stone/15 p-3 first:rounded-t-lg last:rounded-b-lg -mt-px">
          <div className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <AvatarPlaceholder name={displayName} size={40} />
              {i < tweets.length - 1 && <div className="w-0.5 flex-1 bg-stone/20 mt-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-charcoal">{displayName}</span>
                <span className="text-sm text-stone">{handle}</span>
              </div>
              <p className="text-sm text-charcoal whitespace-pre-wrap break-words mt-0.5">{tweet}</p>
              {i === 0 && mediaUrls.length > 0 && (
                <div className="mt-2"><MediaPreview urls={mediaUrls} aspect="wide" /></div>
              )}
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-stone text-center mt-2">{tweets.length} tweet thread</p>
    </div>
  );
}

// ─── YouTube Community Post Preview ───────────────────────────────────
function YouTubeCommunityPreview({ caption, hashtags, mediaUrls, userName }: SocialPreviewProps) {
  const fullText = formatCaption(caption, hashtags);
  const displayName = userName || 'Your Channel';

  return (
    <div className="bg-cream-warm rounded-lg border border-stone/15 shadow-sm overflow-hidden p-3">
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-10 h-10 rounded-full bg-stone/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-stone">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal">{displayName}</p>
          <p className="text-xs text-stone">Just now</p>
        </div>
      </div>
      <p className="text-sm text-charcoal whitespace-pre-wrap break-words line-clamp-5 mb-2">
        {fullText || <span className="text-stone/50 italic">Community post text...</span>}
      </p>
      {mediaUrls.length > 0 && <MediaPreview urls={mediaUrls} aspect="wide" />}
      <div className="flex items-center gap-6 mt-3 text-stone text-xs">
        <span>&#128077; 0</span>
        <span>&#128078; 0</span>
        <span>&#128172; 0</span>
      </div>
    </div>
  );
}

// ─── Single Platform Preview (exported) ────────────────────────────────
export function SocialPreview(props: SocialPreviewProps) {
  const { placementType } = props;

  // Placement-specific routing
  if (placementType) {
    switch (placementType) {
      case 'instagram_reel':
      case 'facebook_reel':
      case 'youtube_short':
        return <ReelPreview {...props} platform={props.platform} />;
      case 'instagram_story':
      case 'facebook_story':
      case 'tiktok_story':
        return <StoryPreview {...props} platform={props.platform} />;
      case 'linkedin_article':
        return <LinkedInArticlePreview {...props} />;
      case 'linkedin_document':
        return <LinkedInDocumentPreview {...props} />;
      case 'twitter_thread':
        return <TwitterThreadPreview {...props} />;
      case 'youtube_community_post':
        return <YouTubeCommunityPreview {...props} />;
      case 'tiktok_video':
        return <TikTokPreview {...props} />;
      case 'youtube_video':
        return <YouTubePreview {...props} />;
      // Feed types fall through to platform-based routing
    }
  }

  // Platform-based routing (legacy/feed)
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

// ─── Placement label helper ─────────────────────────────────────────
const PLACEMENT_LABELS: Record<string, string> = {
  facebook_feed: 'Feed', facebook_reel: 'Reel', facebook_story: 'Story',
  instagram_feed: 'Feed', instagram_reel: 'Reel', instagram_story: 'Story',
  linkedin_feed: 'Feed', linkedin_article: 'Article', linkedin_document: 'Document',
  twitter_tweet: 'Tweet', twitter_thread: 'Thread',
  tiktok_video: 'Video', tiktok_story: 'Story',
  youtube_video: 'Video', youtube_short: 'Short', youtube_community_post: 'Community',
};

// ─── Tabbed Preview (exported) ─────────────────────────────────────────
export function SocialPreviewTabs({ platforms, caption, hashtags, mediaUrls, targetUrl, userName, userAvatar, placements }: SocialPreviewTabsProps) {
  const activePlatforms = platforms.length > 0 ? platforms : (['linkedin'] as SocialPlatform[]);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(activePlatforms[0]);
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementType | null>(null);

  // If selected platform is not in list, reset to first
  const currentPlatform = activePlatforms.includes(selectedPlatform) ? selectedPlatform : activePlatforms[0];

  // Get placements for the current platform
  const platformPlacements = placements
    ? placements.filter(p => p.startsWith(currentPlatform + '_'))
    : [];

  // If we have placements, ensure selected is valid
  const currentPlacement = platformPlacements.length > 0
    ? (selectedPlacement && platformPlacements.includes(selectedPlacement) ? selectedPlacement : platformPlacements[0])
    : null;

  return (
    <div className="space-y-3">
      {/* Platform tab bar */}
      <div className="flex gap-1 bg-stone/5 rounded-lg p-1">
        {activePlatforms.map(p => (
          <button
            key={p}
            onClick={() => { setSelectedPlatform(p); setSelectedPlacement(null); }}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              currentPlatform === p
                ? 'bg-cream-warm text-charcoal shadow-sm'
                : 'text-stone hover:text-charcoal'
            )}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Placement sub-tabs (if placements provided) */}
      {platformPlacements.length > 1 && (
        <div className="flex gap-1 px-1">
          {platformPlacements.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPlacement(p)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                currentPlacement === p
                  ? 'bg-teal/10 text-teal border border-teal/20'
                  : 'text-stone hover:text-charcoal border border-transparent'
              )}
            >
              {PLACEMENT_LABELS[p] || p}
            </button>
          ))}
        </div>
      )}

      {/* Preview */}
      <SocialPreview
        platform={currentPlatform}
        caption={caption}
        hashtags={hashtags}
        mediaUrls={mediaUrls}
        targetUrl={targetUrl}
        userName={userName}
        userAvatar={userAvatar}
        placementType={currentPlacement}
      />

      {/* Char limit indicator */}
      <div className="text-xs text-stone text-center">
        {PLATFORM_LABELS[currentPlatform]}
        {currentPlacement ? ` ${PLACEMENT_LABELS[currentPlacement] || ''}` : ''} limit: {PLATFORM_CHAR_LIMITS[currentPlatform].toLocaleString()} characters
      </div>
    </div>
  );
}
