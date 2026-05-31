import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { getHomeHeroVideo, localizedVideoRawPaths } from '@/lib/media/localizedVideos';

function publicFileExists(publicPath: string) {
  return fs.existsSync(path.join(process.cwd(), 'public', publicPath.replace(/^\//, '')));
}

describe('localized video configuration', () => {
  it.each([
    [
      'zh',
      '/video/home/hero-campus-background-loop.mp4',
      '/video/home/hero-campus-background-original.mp4',
    ],
    ['en', '/video/about.mp4', '/video/about.mp4'],
    ['ru', '/video/culture.mp4', '/video/culture.mp4'],
  ] as const)('provides mapped homepage videos for %s', (locale, loopSrc, fullSrc) => {
    const config = getHomeHeroVideo(locale);

    expect(config.loop.intendedLanguage).toBe(locale);
    expect(config.full.intendedLanguage).toBe(locale);
    expect(config.loop.src).toBe(loopSrc);
    expect(config.full.src).toBe(fullSrc);
    expect(config.poster).toBe('/images/home/franchise-campus-hero-clean-hd.jpg');
    expect(config.modalPoster).toBe('/images/home/hero-campus-video-poster.jpg');
  });

  it('references only existing local homepage video and poster files', () => {
    const paths = [...localizedVideoRawPaths.home, ...localizedVideoRawPaths.posters];

    expect(paths.every(publicFileExists)).toBe(true);
  });
});
