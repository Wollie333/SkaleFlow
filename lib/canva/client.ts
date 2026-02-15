import { CANVA_API_BASE } from './types';
import type { CanvaDesign, CanvaExportJob } from './types';

export class CanvaClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${CANVA_API_BASE}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[canva-client] ${options.method || 'GET'} ${path} failed:`, response.status, errorText);
      throw new Error(`Canva API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async createDesign({ title, width, height }: { title: string; width: number; height: number }): Promise<{ id: string; editUrl: string }> {
    const data = await this.request<{ design: { id: string; urls: { edit_url: string } } }>('/designs', {
      method: 'POST',
      body: JSON.stringify({
        design_type: 'custom',
        title,
        width,
        height,
      }),
    });

    return {
      id: data.design.id,
      editUrl: data.design.urls.edit_url,
    };
  }

  async listDesigns({ query, continuation }: { query?: string; continuation?: string } = {}): Promise<{ designs: CanvaDesign[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (continuation) params.set('continuation', continuation);
    params.set('ownership', 'owned');

    const queryString = params.toString();
    const path = `/designs${queryString ? `?${queryString}` : ''}`;

    const data = await this.request<{ items: CanvaDesign[]; continuation?: string }>(path);

    return {
      designs: data.items || [],
      continuation: data.continuation,
    };
  }

  async createExport(designId: string, format: 'png' | 'jpg' | 'pdf' = 'png'): Promise<string> {
    const data = await this.request<{ job: { id: string } }>('/exports', {
      method: 'POST',
      body: JSON.stringify({
        design_id: designId,
        format: {
          type: format === 'jpg' ? 'jpg' : format === 'pdf' ? 'pdf' : 'png',
        },
      }),
    });

    return data.job.id;
  }

  async getExport(exportId: string): Promise<CanvaExportJob> {
    const data = await this.request<{ job: CanvaExportJob }>(`/exports/${exportId}`);
    return data.job;
  }

  async pollExportUntilReady(exportId: string, maxAttempts = 30, intervalMs = 1000): Promise<CanvaExportJob> {
    for (let i = 0; i < maxAttempts; i++) {
      const job = await this.getExport(exportId);

      if (job.status === 'success') return job;
      if (job.status === 'failed') {
        throw new Error(`Canva export failed: ${job.error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Canva export timed out');
  }

  async uploadAssetByUrl({ name, url, tags }: { name: string; url: string; tags?: string[] }): Promise<{ id: string }> {
    const body: Record<string, unknown> = {
      name,
      url,
    };
    if (tags && tags.length > 0) {
      body.tags = tags;
    }

    const data = await this.request<{ asset: { id: string } }>('/asset-uploads', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return { id: data.asset.id };
  }

  async uploadAssetFromBuffer({ name, buffer, mimeType, tags }: { name: string; buffer: Buffer; mimeType: string; tags?: string[] }): Promise<{ id: string }> {
    // For direct upload, we need multipart/form-data
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    formData.append('asset', blob, name);
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    const response = await fetch(`${CANVA_API_BASE}/asset-uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canva asset upload failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { id: data.asset.id };
  }
}
