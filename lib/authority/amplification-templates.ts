/**
 * 7-post amplification campaign structure for PR placements.
 * Used when pushing a Published authority card to the Content Engine.
 */

export interface AmplificationPost {
  sequence: number;
  label: string;
  description: string;
  suggestedPlatforms: string[];
  dayOffset: number; // days from publish date
}

export const AMPLIFICATION_POSTS: AmplificationPost[] = [
  {
    sequence: 1,
    label: 'Announcement',
    description: 'Share the exciting news of the placement. Link to the article/episode. Use a strong hook.',
    suggestedPlatforms: ['linkedin', 'twitter', 'facebook'],
    dayOffset: 0,
  },
  {
    sequence: 2,
    label: 'Key Insight',
    description: 'Pull the most quotable or surprising insight from the placement. Make it a standalone value post.',
    suggestedPlatforms: ['linkedin', 'twitter'],
    dayOffset: 1,
  },
  {
    sequence: 3,
    label: 'Behind the Scenes',
    description: 'Share the backstory — how the placement happened, what it means, lessons learned.',
    suggestedPlatforms: ['instagram', 'linkedin'],
    dayOffset: 2,
  },
  {
    sequence: 4,
    label: 'Data Point',
    description: 'Pull a stat, fact, or data point from the placement. Create a visual/carousel around it.',
    suggestedPlatforms: ['linkedin', 'twitter', 'instagram'],
    dayOffset: 4,
  },
  {
    sequence: 5,
    label: 'Question',
    description: 'Ask your audience a question related to the topic. Drive engagement and conversation.',
    suggestedPlatforms: ['linkedin', 'twitter'],
    dayOffset: 5,
  },
  {
    sequence: 6,
    label: 'Thank You',
    description: 'Tag and thank the outlet, journalist, or host. Show gratitude publicly.',
    suggestedPlatforms: ['linkedin', 'twitter', 'instagram'],
    dayOffset: 7,
  },
  {
    sequence: 7,
    label: 'Callback',
    description: 'Circle back to the placement 1-2 weeks later with a fresh take or update on results.',
    suggestedPlatforms: ['linkedin', 'twitter'],
    dayOffset: 14,
  },
];

export const TEASER_POSTS: AmplificationPost[] = [
  {
    sequence: 1,
    label: 'Coming Soon Teaser',
    description: 'Hint that something exciting is coming without revealing details. Build anticipation.',
    suggestedPlatforms: ['linkedin', 'instagram'],
    dayOffset: -3,
  },
  {
    sequence: 2,
    label: 'Sneak Peek',
    description: 'Share a behind-the-scenes glimpse — photo from set, prep work, or cryptic hint.',
    suggestedPlatforms: ['instagram', 'twitter'],
    dayOffset: -1,
  },
];
