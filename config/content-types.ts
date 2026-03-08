// ============================================================
// V3 Content Engine — 7 Content Types
// Spectrum: Decision Makers ← → Practitioners
// Left = slow growth, high conversion | Right = fast growth, high volume
// ============================================================

export type ContentTypeId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ContentFormat =
  | 'reel'
  | 'static'
  | 'carousel'
  | 'text'
  | 'video'
  | 'long_video'
  | 'thread'
  | 'story';

export interface ContentTypeConfig {
  id: ContentTypeId;
  name: string;
  shortName: string;
  description: string;
  examples: string[];
  primaryOutcome: string;
  bestFormats: ContentFormat[];
  spectrumPosition: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
  audienceTarget: 'decision_makers' | 'champions' | 'practitioners';
}

export const CONTENT_TYPES: Record<ContentTypeId, ContentTypeConfig> = {
  1: {
    id: 1,
    name: 'Outcome Oriented',
    shortName: 'Outcome',
    description: 'Proof of results. KPIs, revenue numbers, growth metrics, case study data.',
    examples: [
      '"We generated R291K with R5K spend."',
      'Revenue screenshots. Before/after metrics.',
      'Client results and case studies.',
    ],
    primaryOutcome: 'Slowest audience growth. Wins decision makers. Closes high-ticket buyers.',
    bestFormats: ['carousel', 'static', 'video', 'text'],
    spectrumPosition: 'left',
    audienceTarget: 'decision_makers',
  },
  2: {
    id: 2,
    name: 'Point of View',
    shortName: 'POV',
    description: 'Primary insight, core values, strategic narrative. Contrarian takes. Belief statements.',
    examples: [
      '"Most marketing advice keeps you dependent on the person giving it."',
      'Strategy principles and worldview content.',
      'What you stand for and why.',
    ],
    primaryOutcome: 'Wins decision makers. Attracts people who share your worldview. Builds authority.',
    bestFormats: ['text', 'reel', 'static', 'video'],
    spectrumPosition: 'center-left',
    audienceTarget: 'decision_makers',
  },
  3: {
    id: 3,
    name: 'Strategic',
    shortName: 'Strategic',
    description: 'High-level processes, complete overviews, strategy summaries. The big picture thinking.',
    examples: [
      '"The 3-engine approach to brand building."',
      '"Why your funnel is upside down."',
      'Strategy breakdowns and complete overviews.',
    ],
    primaryOutcome: 'Medium audience growth. Positions you as seeing the full picture.',
    bestFormats: ['carousel', 'long_video', 'text', 'thread'],
    spectrumPosition: 'center-left',
    audienceTarget: 'champions',
  },
  4: {
    id: 4,
    name: 'Frameworks',
    shortName: 'Framework',
    description: 'Abstract frameworks, decision matrices, planning models. Thinking tools.',
    examples: [
      '"The Brand Gravity Method in one image."',
      '"Use this matrix to decide your content mix."',
      'Decision trees and comparison frameworks.',
    ],
    primaryOutcome: 'Medium audience growth. Wins champions — people who recommend you to decision makers.',
    bestFormats: ['carousel', 'static', 'thread', 'video'],
    spectrumPosition: 'center',
    audienceTarget: 'champions',
  },
  5: {
    id: 5,
    name: 'Step-by-Step Guides',
    shortName: 'Guide',
    description: 'Action plans, roadmaps, tactical systems, workflows, playbooks.',
    examples: [
      '"How to create a 30-day content calendar in 60 minutes."',
      '"5 steps to define your ICP."',
      'Roadmaps and detailed how-to content.',
    ],
    primaryOutcome: 'Faster audience growth. People save and share this content.',
    bestFormats: ['carousel', 'long_video', 'thread', 'reel'],
    spectrumPosition: 'center-right',
    audienceTarget: 'practitioners',
  },
  6: {
    id: 6,
    name: 'Tactics',
    shortName: 'Tactic',
    description: 'Lists of tools, quick tips, mini guides, best practices, checklists.',
    examples: [
      '"7 tools every founder needs."',
      '"Quick tip: Always lead with the problem."',
      'LinkedIn posting checklist.',
    ],
    primaryOutcome: 'Fastest audience growth. Wins practitioners — people who implement.',
    bestFormats: ['reel', 'carousel', 'static', 'text'],
    spectrumPosition: 'right',
    audienceTarget: 'practitioners',
  },
  7: {
    id: 7,
    name: 'Micro Execution',
    shortName: 'Micro',
    description: "Do's vs don'ts, tool breakdowns, templates, hacks, before/afters, micro-tweaks.",
    examples: [
      '"Before vs after: this headline change doubled engagement."',
      '"Don\'t do X. Do Y instead."',
      'Templates and real examples.',
    ],
    primaryOutcome: 'Fastest audience growth. Extremely shareable. Wins practitioners.',
    bestFormats: ['reel', 'static', 'carousel', 'story'],
    spectrumPosition: 'right',
    audienceTarget: 'practitioners',
  },
};

// ---- Helpers ----

export function getContentType(id: ContentTypeId): ContentTypeConfig {
  return CONTENT_TYPES[id];
}

export function getContentTypeName(id: ContentTypeId): string {
  return CONTENT_TYPES[id].name;
}

export const ALL_CONTENT_TYPE_IDS: ContentTypeId[] = [1, 2, 3, 4, 5, 6, 7];

/** Spectrum labels for UI rendering */
export const SPECTRUM = {
  left: { label: 'Decision Makers', description: 'Slow growth, high conversion value' },
  right: { label: 'Practitioners', description: 'Fast growth, high volume' },
} as const;
