import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '永霏防护 YourField Group',
    short_name: 'YourField',
    description: '永霏防护特种防护装备企业官网',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e3a5f',
    lang: 'zh-CN',
    icons: [
      {
        src: '/favicon.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
