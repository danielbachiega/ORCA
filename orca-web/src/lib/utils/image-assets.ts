import { API_CONFIG } from '@/lib/constants';

const gatewayPublicBase = (() => {
  const configured = process.env.NEXT_PUBLIC_GATEWAY_API;
  if (!configured) {
    return 'http://localhost:5000';
  }

  return configured.endsWith('/api')
    ? configured.slice(0, -4)
    : configured.replace(/\/$/, '');
})();

export const resolveImageAssetUrl = (url: string): string => {
  if (!url) return url;

  if (url.startsWith('/image-assets/')) {
    return `${gatewayPublicBase}${url}`;
  }

  if (url.startsWith('/')) {
    return `${API_CONFIG.CATALOG}${url}`;
  }

  return url;
};
