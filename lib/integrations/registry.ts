import { IntegrationAdapter } from './types';

const adapters = new Map<string, IntegrationAdapter>();

export function registerAdapter(adapter: IntegrationAdapter) {
  adapters.set(adapter.type, adapter);
}

export function getAdapter(type: string): IntegrationAdapter | undefined {
  return adapters.get(type);
}

export function listAdapters(): IntegrationAdapter[] {
  return Array.from(adapters.values());
}
