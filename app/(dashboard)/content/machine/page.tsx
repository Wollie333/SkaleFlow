'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import {
  BoltIcon,
  SparklesIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  VideoCameraIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { ContentMachineType } from '@/components/content-machine/types';

interface ContentTypeCard {
  type: ContentMachineType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  enabled: boolean;
}

const CONTENT_TYPES: ContentTypeCard[] = [
  {
    type: 'social',
    title: 'Social Posts',
    description: 'Generate social media content across platforms and placements',
    icon: SparklesIcon,
    colorClass: 'text-teal',
    bgClass: 'bg-teal/10',
    enabled: true,
  },
  {
    type: 'blog',
    title: 'Blog Articles',
    description: 'SEO-optimized blog posts and long-form articles',
    icon: DocumentTextIcon,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    enabled: false,
  },
  {
    type: 'email',
    title: 'Email Sequences',
    description: 'Nurture sequences, newsletters, and campaign emails',
    icon: EnvelopeIcon,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    enabled: false,
  },
  {
    type: 'ads',
    title: 'Ad Copy',
    description: 'Facebook, Google, and LinkedIn ad copy variations',
    icon: MegaphoneIcon,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    enabled: false,
  },
  {
    type: 'video-scripts',
    title: 'Video Scripts',
    description: 'YouTube, Reels, and TikTok video scripts',
    icon: VideoCameraIcon,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50',
    enabled: false,
  },
  {
    type: 'landing-pages',
    title: 'Landing Pages',
    description: 'High-converting landing page copy and structure',
    icon: CursorArrowRaysIcon,
    colorClass: 'text-gold',
    bgClass: 'bg-gold/10',
    enabled: false,
  },
];

export default function ContentMachineHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Machine"
        icon={BoltIcon}
        subtitle="Choose a content type to generate"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONTENT_TYPES.map((ct) => {
          const Icon = ct.icon;
          const card = (
            <div
              key={ct.type}
              className={cn(
                'relative rounded-xl border bg-white p-6 transition-all',
                ct.enabled
                  ? 'border-stone/10 hover:border-teal hover:shadow-md cursor-pointer'
                  : 'border-stone/5 opacity-60 cursor-default'
              )}
            >
              {!ct.enabled && (
                <span className="absolute top-3 right-3 text-[10px] bg-stone/10 text-stone px-2 py-0.5 rounded-full font-medium">
                  Coming Soon
                </span>
              )}
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', ct.bgClass)}>
                <Icon className={cn('w-6 h-6', ct.colorClass)} />
              </div>
              <h3 className={cn(
                'text-sm font-semibold mb-1',
                ct.enabled ? 'text-charcoal' : 'text-stone'
              )}>
                {ct.title}
              </h3>
              <p className="text-xs text-stone leading-relaxed">{ct.description}</p>
            </div>
          );

          if (ct.enabled) {
            return (
              <Link key={ct.type} href={`/content/machine/${ct.type}`} className="block">
                {card}
              </Link>
            );
          }

          return <div key={ct.type}>{card}</div>;
        })}
      </div>
    </div>
  );
}
