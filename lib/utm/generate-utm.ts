export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

export function generateUTMParams(context: {
  platform: string;
  funnelStage: string;
  format: string;
  topic: string | null;
  scheduledDate: string;
}): UTMParams {
  const date = context.scheduledDate.slice(0, 7); // YYYY-MM
  const slugifiedTopic = context.topic
    ? context.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
    : 'untitled';

  return {
    utm_source: context.platform.toLowerCase(),
    utm_medium: 'social',
    utm_campaign: `${date}-${context.funnelStage}`,
    utm_content: `${context.format.replace(/_/g, '-')}-${slugifiedTopic}`,
    utm_term: '',
  };
}

export function buildTrackedUrl(baseUrl: string, params: UTMParams): string {
  if (!baseUrl) return '';

  try {
    const url = new URL(baseUrl);
    if (params.utm_source) url.searchParams.set('utm_source', params.utm_source);
    if (params.utm_medium) url.searchParams.set('utm_medium', params.utm_medium);
    if (params.utm_campaign) url.searchParams.set('utm_campaign', params.utm_campaign);
    if (params.utm_content) url.searchParams.set('utm_content', params.utm_content);
    if (params.utm_term) url.searchParams.set('utm_term', params.utm_term);
    return url.toString();
  } catch {
    // If URL is invalid, just append query params
    const paramString = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    if (!paramString) return baseUrl;
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${paramString}`;
  }
}
