import { API_CONFIG } from '@/lib/constants';

export const resolveImageAssetUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('/')) {
    return `${API_CONFIG.CATALOG}${url}`;
  }
  return url;
};
