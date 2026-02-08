import { createServiceClient } from '@/lib/supabase/server';
import { buildMergeContext } from '../merge-fields';
import { StepConfig } from '../types';

export async function executeWebhook(
  contactId: string,
  config: StepConfig
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  const supabase = createServiceClient();

  let url = config.url;
  let method = config.method || 'POST';
  let headers: Record<string, string> = config.headers || {};

  // If endpoint_id is provided, load from webhook_endpoints table
  if (config.endpoint_id) {
    const { data: endpoint } = await supabase
      .from('webhook_endpoints')
      .select('url, method, headers')
      .eq('id', config.endpoint_id)
      .single();

    if (!endpoint) {
      return { success: false, error: 'Webhook endpoint not found' };
    }

    url = endpoint.url;
    method = endpoint.method;
    headers = (endpoint.headers || {}) as Record<string, string>;
  }

  if (!url) {
    return { success: false, error: 'No webhook URL configured' };
  }

  const context = await buildMergeContext(contactId);

  const { data: contact } = await supabase
    .from('pipeline_contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  const payload = {
    event: 'automation_webhook',
    timestamp: new Date().toISOString(),
    contact: contact || {},
    context: {
      pipeline: context.pipeline,
      stage: context.stage,
      organization: context.org,
    },
  };

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook returned ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    return { success: true, statusCode: response.status };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Webhook request failed' };
  }
}
