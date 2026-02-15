export interface CanvaTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  canvaUserId?: string;
  scopes: string[];
}

export interface CanvaDesign {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  urls: {
    edit_url: string;
    view_url: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CanvaExportJob {
  id: string;
  status: 'in_progress' | 'success' | 'failed';
  urls?: string[];
  error?: { code: string; message: string };
}

export interface PlatformDesignSize {
  label: string;
  width: number;
  height: number;
  platform: string;
}

export const PLATFORM_DESIGN_SIZES: PlatformDesignSize[] = [
  { label: 'Instagram Post', width: 1080, height: 1080, platform: 'instagram' },
  { label: 'Instagram Story / Reel', width: 1080, height: 1920, platform: 'instagram' },
  { label: 'Facebook Post', width: 1200, height: 630, platform: 'facebook' },
  { label: 'LinkedIn Post', width: 1200, height: 627, platform: 'linkedin' },
  { label: 'Twitter/X Post', width: 1200, height: 675, platform: 'twitter' },
  { label: 'TikTok', width: 1080, height: 1920, platform: 'tiktok' },
  { label: 'YouTube Thumbnail', width: 1280, height: 720, platform: 'youtube' },
];

export const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export const CANVA_SCOPES = [
  'design:content:read',
  'design:content:write',
  'asset:read',
  'asset:write',
];
