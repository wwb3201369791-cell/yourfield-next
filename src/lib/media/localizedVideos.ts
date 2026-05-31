import type { Locale } from '@/lib/i18n/locale';
import { resolvePublicVideoUrl } from '@/lib/media/publicAsset';

export type LocalizedVideoAsset = Readonly<{
  src: string;
  rawSrc: string;
  poster: string;
  /** Language intent for future customer-provided replacement assets. */
  intendedLanguage: 'zh' | 'en' | 'ru';
  /** True when the current file is a real existing local fallback instead of final customer language media. */
  usesExistingFallback: boolean;
}>;

export type HomeHeroVideoAsset = Readonly<{
  loop: LocalizedVideoAsset;
  full: LocalizedVideoAsset;
  poster: string;
  modalPoster: string;
}>;

const homeLoopFallback = '/video/home/hero-campus-background-loop.mp4';
const homeFullFallback = '/video/home/hero-campus-background-original.mp4';
const homeEnglishFallback = '/video/about.mp4';
const homeRussianFallback = '/video/culture.mp4';
const homePoster = '/images/home/franchise-campus-hero-clean-hd.jpg';
const homeModalPoster = '/images/home/hero-campus-video-poster.jpg';

function videoAsset(
  rawSrc: string,
  poster: string,
  intendedLanguage: LocalizedVideoAsset['intendedLanguage'],
  usesExistingFallback = true,
): LocalizedVideoAsset {
  return {
    intendedLanguage,
    poster,
    rawSrc,
    src: resolvePublicVideoUrl(rawSrc),
    usesExistingFallback,
  };
}

export function getHomeHeroVideo(locale: Locale): HomeHeroVideoAsset {
  const localeVideos: Record<Locale, { full: string; loop: string }> = {
    en: { full: homeEnglishFallback, loop: homeEnglishFallback },
    ru: { full: homeRussianFallback, loop: homeRussianFallback },
    zh: { full: homeFullFallback, loop: homeLoopFallback },
  };
  const video = localeVideos[locale];

  return {
    full: videoAsset(video.full, homeModalPoster, locale),
    loop: videoAsset(video.loop, homePoster, locale),
    modalPoster: homeModalPoster,
    poster: homePoster,
  };
}

export const localizedVideoRawPaths = {
  home: [homeLoopFallback, homeFullFallback, homeEnglishFallback, homeRussianFallback] as const,
  posters: [homePoster, homeModalPoster] as const,
};
