export interface IntegrationAdapter {
  type: string;
  name: string;
  description: string;
  icon: string;
  connect: (config: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  disconnect: (configId: string) => Promise<void>;
  test: (configId: string) => Promise<{ connected: boolean; error?: string }>;
}

export interface IntegrationConfig {
  id: string;
  organization_id: string;
  integration_type: string;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  is_active: boolean;
  connected_by: string | null;
  created_at: string;
  updated_at: string;
}

export const AVAILABLE_INTEGRATIONS = [
  { type: 'google_calendar', name: 'Google Calendar', description: 'Sync meetings and events', icon: '📅', available: false },
  { type: 'google_drive', name: 'Google Drive', description: 'Store and share files', icon: '📁', available: false },
  { type: 'slack', name: 'Slack', description: 'Send notifications to channels', icon: '💬', available: false },
  { type: 'zapier', name: 'Zapier', description: 'Connect to 5000+ apps', icon: '⚡', available: false },
  { type: 'make', name: 'Make (Integromat)', description: 'Visual automation platform', icon: '🔗', available: false },
];
