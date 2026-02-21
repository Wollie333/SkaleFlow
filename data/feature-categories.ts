export interface FeatureLink {
  slug: string;
  label: string;
}

export interface FeatureCategory {
  name: string;
  features: FeatureLink[];
}

export const featureCategories: FeatureCategory[] = [
  {
    name: 'SkaleFlow Engines',
    features: [
      { slug: 'brand-strategy-engine', label: 'Brand Engine' },
      { slug: 'ai-content-engine', label: 'Content Engine' },
      { slug: 'authority-engine', label: 'Authority Engine' },
    ],
  },
  {
    name: 'Brand Strategy',
    features: [
      { slug: 'brand-archetype-system', label: 'Brand Archetypes' },
      { slug: 'brand-playbook-export', label: 'Brand Playbook' },
      { slug: 'brand-audit', label: 'Brand Audits' },
    ],
  },
  {
    name: 'Content Marketing',
    features: [
      { slug: 'content-calendar-system', label: 'Content Calendar' },
      { slug: 'content-approval-workflow', label: 'Approval Workflow' },
      { slug: 'social-media-management', label: 'Social Management' },
      { slug: 'multi-platform-publishing', label: 'Multi-Platform Publishing' },
    ],
  },
  {
    name: 'Sales & Pipeline',
    features: [
      { slug: 'sales-pipeline-crm', label: 'Sales Pipeline' },
      { slug: 'ai-sales-calls', label: 'AI Sales Calls' },
    ],
  },
  {
    name: 'Analytics',
    features: [
      { slug: 'marketing-analytics-dashboard', label: 'Analytics Dashboard' },
      { slug: 'seo-utm-tracking', label: 'UTM Tracking' },
      { slug: 'credit-based-ai-billing', label: 'AI Billing' },
    ],
  },
  {
    name: 'Team & Growth',
    features: [
      { slug: 'team-collaboration-hub', label: 'Collaboration Hub' },
      { slug: 'role-based-access-control', label: 'Access Control' },
      { slug: 'skaleflow-methodology', label: 'The SkaleFlow System' },
    ],
  },
];
