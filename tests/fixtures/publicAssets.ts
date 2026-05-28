import type { Locale } from '@/lib/i18n/locale';
import { resolvePublicVideoUrl } from '@/lib/media/publicAsset';

export const testLocales = ['zh', 'en', 'ru'] as const satisfies readonly Locale[];

export const localeLabels: Record<Locale, string> = {
  zh: '简体中文',
  en: 'English',
  ru: 'Русский',
};

export const publicVideoPaths = {
  about: '/video/about.mp4',
  culture: '/video/culture.mp4',
  homeFull: '/video/home/hero-campus-background-original.mp4',
  homeLoop: '/video/home/hero-campus-background-loop.mp4',
} as const;

export const publicVideoUrls = {
  about: resolvePublicVideoUrl(publicVideoPaths.about),
  culture: resolvePublicVideoUrl(publicVideoPaths.culture),
  homeFull: resolvePublicVideoUrl(publicVideoPaths.homeFull),
  homeLoop: resolvePublicVideoUrl(publicVideoPaths.homeLoop),
} as const;

export function appUrl(baseUrl: string, locale: Locale, path = '') {
  return `${baseUrl.replace(/\/$/, '')}/${locale}${path}`;
}
