import { describe, expect, it } from 'vitest';

import { locales } from '@/lib/i18n/locale';
import {
  createRobotsRules,
  isIndexingAllowed,
  isSafeSitemapSlug,
  localizedSitemapEntries,
  noIndexPublicRoutes,
  publicSitemapRoutes,
  robotsDisallowPaths,
  sitemapLanguages,
} from '@/lib/seo/assets';

describe('SEO assets', () => {
  it('creates localized sitemap entries with hreflang alternates', () => {
    const entries = localizedSitemapEntries();

    expect(entries).toHaveLength(publicSitemapRoutes.length * locales.length);
    expect(entries.some((entry) => entry.url.endsWith('/search'))).toBe(false);
    expect(noIndexPublicRoutes).toContain('/search');

    const aboutAlternates = sitemapLanguages('/about');

    expect(aboutAlternates['zh-CN']).toMatch(/\/zh\/about$/);
    expect(aboutAlternates.en).toMatch(/\/en\/about$/);
    expect(aboutAlternates.ru).toMatch(/\/ru\/about$/);
    expect(aboutAlternates['ru-RU']).toMatch(/\/ru\/about$/);
    expect(aboutAlternates['x-default']).toMatch(/\/zh\/about$/);
  });

  it('keeps robots permissive only in production while blocking private surfaces', () => {
    expect(createRobotsRules(false)).toEqual([{ userAgent: '*', disallow: '/' }]);

    const productionRules = createRobotsRules(true);

    expect(productionRules).toHaveLength(4);
    expect(JSON.stringify(productionRules)).toContain('Googlebot');
    expect(JSON.stringify(productionRules)).toContain('Baiduspider');
    expect(JSON.stringify(productionRules)).toContain('/admin');
    expect(JSON.stringify(productionRules)).toContain('/api/');
    expect(JSON.stringify(productionRules)).toContain('/*/search');
    expect(robotsDisallowPaths).not.toContain('GPTBot');
  });

  it('blocks preview and staging indexing even for production builds', () => {
    expect(
      isIndexingAllowed({
        nodeEnv: 'production',
        siteUrl: 'https://yourfield-git-p3-preview.vercel.app',
        vercelEnv: 'preview',
      }),
    ).toBe(false);
    expect(
      isIndexingAllowed({
        nodeEnv: 'production',
        siteUrl: 'https://staging.yourfield.cn',
        vercelEnv: 'production',
      }),
    ).toBe(false);
    expect(
      isIndexingAllowed({
        allowIndexing: 'false',
        nodeEnv: 'production',
        siteUrl: 'https://www.yourfield.cn',
        vercelEnv: 'production',
      }),
    ).toBe(false);
    expect(
      isIndexingAllowed({
        nodeEnv: 'production',
        siteUrl: 'https://www.yourfield.cn',
        vercelEnv: 'production',
      }),
    ).toBe(true);
  });

  it('accepts only stable public content slugs for dynamic sitemap URLs', () => {
    expect(isSafeSitemapSlug('firefighter-suit-combat')).toBe(true);
    expect(isSafeSitemapSlug('HYF-5506')).toBe(false);
    expect(isSafeSitemapSlug('../admin')).toBe(false);
    expect(isSafeSitemapSlug('products/firefighter')).toBe(false);
  });
});
