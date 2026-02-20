'use client';

import type { BrandAuditSectionKey } from '@/types/database';
import { CompanyOverviewForm } from './company-overview-form';
import { BrandFoundationForm } from './brand-foundation-form';
import { VisualIdentityForm } from './visual-identity-form';
import { MessagingForm } from './messaging-form';
import { DigitalPresenceForm } from './digital-presence-form';
import { CustomerExperienceForm } from './customer-experience-form';
import { CompetitiveLandscapeForm } from './competitive-landscape-form';
import { GoalsChallengesForm } from './goals-challenges-form';

interface SectionFormProps {
  sectionKey: BrandAuditSectionKey;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function SectionForm({ sectionKey, data, onChange }: SectionFormProps) {
  switch (sectionKey) {
    case 'company_overview':
      return <CompanyOverviewForm data={data as any} onChange={onChange as any} />;
    case 'brand_foundation':
      return <BrandFoundationForm data={data as any} onChange={onChange as any} />;
    case 'visual_identity':
      return <VisualIdentityForm data={data as any} onChange={onChange as any} />;
    case 'messaging':
      return <MessagingForm data={data as any} onChange={onChange as any} />;
    case 'digital_presence':
      return <DigitalPresenceForm data={data as any} onChange={onChange as any} />;
    case 'customer_experience':
      return <CustomerExperienceForm data={data as any} onChange={onChange as any} />;
    case 'competitive_landscape':
      return <CompetitiveLandscapeForm data={data as any} onChange={onChange as any} />;
    case 'goals_challenges':
      return <GoalsChallengesForm data={data as any} onChange={onChange as any} />;
    default:
      return <div className="text-stone text-sm">Unknown section</div>;
  }
}
