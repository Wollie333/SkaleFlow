export interface FeatureLink {
  slug: string;
  label: string;
  mvpEnabled?: boolean; // Features available in MVP beta
}

export interface FeatureCategory {
  name: string;
  features: FeatureLink[];
}

export const featureCategories: FeatureCategory[] = [
  {
    name: 'Core Engines',
    features: [
      { slug: 'brand-strategy-engine', label: 'Brand Engine', mvpEnabled: true },
      { slug: 'presence-engine', label: 'Presence Engine', mvpEnabled: false },
      { slug: 'ai-content-engine', label: 'Content Engine', mvpEnabled: true },
      { slug: 'ads-engine', label: 'Ads Engine', mvpEnabled: false },
      { slug: 'authority-engine', label: 'Authority Engine', mvpEnabled: false },
      { slug: 'marketing-analytics-dashboard', label: 'Analytics', mvpEnabled: false },
      { slug: 'team-collaboration-hub', label: 'Team Collaboration', mvpEnabled: false },
    ],
  },
];
