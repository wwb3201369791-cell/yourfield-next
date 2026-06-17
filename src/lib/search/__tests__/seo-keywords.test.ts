import { describe, expect, it } from 'vitest';

import { searchContent } from '@/lib/search/search';
import { getSeoHotTerms, getSeoIndustryCaseDocuments } from '@/lib/search/seo-keywords';
import type { SearchSourceProvider } from '@/lib/search/types';

describe('SEO procurement keyword search data', () => {
  it('exposes procurement hot terms per locale', () => {
    expect(getSeoHotTerms('en')).toEqual(
      expect.arrayContaining([
        'FR Coveralls Manufacturer',
        'Arc Flash Clothing Manufacturer',
        'Chemical Protective Suit Manufacturer',
      ]),
    );
    expect(getSeoHotTerms('zh')).toContain('阻燃连体服厂家');
    expect(getSeoHotTerms('ru')).toContain('Производитель огнестойких комбинезонов');
  });

  it('makes English procurement searches resolve to static industry cases', async () => {
    const sourceProvider: SearchSourceProvider = async (input) => ({
      faqs: [],
      industryCases: getSeoIndustryCaseDocuments(input.locale),
      news: [],
      pages: [],
      products: [],
      solutions: [],
    });

    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'en',
        page: 1,
        q: 'FR Coveralls Manufacturer',
        type: 'all',
      },
      sourceProvider,
    );

    expect(response.totalHits).toBeGreaterThan(0);
    expect(response.hits[0]).toMatchObject({
      id: 'industry-case:seo-oil-gas-fr-clothing',
      title: 'FR Coveralls & Flame Resistant Clothing for Oil & Gas',
      type: 'industry-case',
      url: '/en/products#industry-petrochemical',
    });
  });

  it('keeps localized procurement terms as header/search-page hot terms without injecting non-English static hits', () => {
    expect(getSeoHotTerms('zh')).toContain('防电弧服厂家');
    expect(getSeoHotTerms('ru')).toContain('Производитель огнестойких комбинезонов');
    expect(getSeoIndustryCaseDocuments('zh')).toEqual([]);
    expect(getSeoIndustryCaseDocuments('ru')).toEqual([]);
  });
});
