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
  return {
    full: videoAsset(homeFullFallback, homeModalPoster, locale),
    loop: videoAsset(homeLoopFallback, homePoster, locale),
    modalPoster: homeModalPoster,
    poster: homePoster,
  };
}

export const localizedVideoRawPaths = {
  home: [homeLoopFallback, homeFullFallback] as const,
  posters: [homePoster, homeModalPoster] as const,
};
