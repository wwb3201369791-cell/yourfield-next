import { describe, expect, it } from 'vitest';

import { legacyPages } from '../../scripts/seed/import-legacy-pages';

const locales = ['zh', 'en', 'ru'] as const;

describe('legacy page SEO seed copy', () => {
  it('uses localized meta descriptions that are more useful than page titles', () => {
    for (const page of legacyPages) {
      for (const locale of locales) {
        const title = page.title[locale];
        const description = page.seoDescription[locale];

        expect(description, `${page.pageKey} ${locale} description`).toBeTruthy();
        expect(description, `${page.pageKey} ${locale} description`).not.toBe(title);
        expect(
          description.length,
          `${page.pageKey} ${locale} description should be descriptive`,
        ).toBeGreaterThan(title.length + 12);
      }
    }
  });
});
