import type { AuthorityCategory } from './types';

const CHECKLIST_BY_CATEGORY: Record<AuthorityCategory, string[]> = {
  media_placement: [
    'Headshot sent to publication',
    'Professional bio sent',
    'Company fact sheet sent',
    'Product/brand images sent',
    'Brand guidelines sent',
    'Interview questions reviewed',
    'Draft reviewed and approved',
  ],
  podcast_appearance: [
    'Bio sent to host',
    'Headshot sent',
    'Talking points prepared',
    'Tech check completed',
    'Episode details confirmed',
    'Social handles shared for tagging',
  ],
  press_release: [
    'Press release drafted',
    'Quotes approved by stakeholders',
    'Supporting images prepared',
    'Distribution list confirmed',
    'Boilerplate verified',
    'Contact information confirmed',
  ],
  magazine_feature: [
    'Headshot sent (high-resolution)',
    'Bio sent (long version)',
    'Fact sheet sent',
    'Product/lifestyle images sent',
    'Brand guidelines sent',
    'Interview completed',
    'Draft reviewed and approved',
    'Image usage rights confirmed',
  ],
  live_event: [
    'Speaker one-sheet sent',
    'Presentation slides prepared',
    'AV requirements confirmed',
    'Travel/accommodation arranged',
    'Social media event details confirmed',
    'Bio and headshot sent to organisers',
  ],
  tv_video: [
    'Talking points prepared',
    'Wardrobe/appearance planned',
    'Location/studio confirmed',
    'Brand assets sent to producer',
    'Release/consent forms signed',
  ],
  award_recognition: [
    'Application/nomination submitted',
    'Supporting materials sent',
    'Case studies prepared',
    'Testimonials gathered',
    'Entry fee paid (if applicable)',
  ],
  thought_leadership: [
    'Article/op-ed drafted',
    'Research/data verified',
    'Draft reviewed',
    'Author bio confirmed',
    'Headshot sent',
  ],
};

export function getChecklistForCategory(category: AuthorityCategory): string[] {
  return CHECKLIST_BY_CATEGORY[category] || [];
}
