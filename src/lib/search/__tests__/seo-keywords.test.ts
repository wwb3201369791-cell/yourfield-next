import { describe, expect, it } from 'vitest';

import { searchContent } from '@/lib/search/search';
import { getSeoHotTerms, getSeoIndustryCaseDocuments } from '@/lib/search/seo-keywords';
import type { SearchSourceProvider } from '@/lib/search/types';

const seoSourceProvider: SearchSourceProvider = async (input) => ({
  faqs: [],
  industryCases: getSeoIndustryCaseDocuments(input.locale, input.q),
  news: [],
  pages: [],
  products: [],
  solutions: [],
});

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
    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'en',
        page: 1,
        q: 'FR Coveralls Manufacturer',
        type: 'all',
      },
      seoSourceProvider,
    );

    expect(response.totalHits).toBeGreaterThan(0);
    expect(response.hits[0]).toMatchObject({
      id: 'industry-case:seo-oil-gas-fr-clothing',
      title: 'FR Coveralls & Flame Resistant Clothing for Oil & Gas',
      type: 'industry-case',
      url: '/en/products#industry-petrochemical',
    });
  });

  it('makes localized procurement searches resolve while keeping short generic searches untouched', async () => {
    const procurementResponse = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '阻燃连体服厂家',
        type: 'all',
      },
      seoSourceProvider,
    );
    const genericResponse = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '消防',
        type: 'all',
      },
      seoSourceProvider,
    );

    expect(procurementResponse.hits[0]).toMatchObject({
      id: 'industry-case:seo-oil-gas-fr-clothing',
      title: '石油天然气阻燃防护服采购方案',
      type: 'industry-case',
      url: '/zh/products#industry-petrochemical',
    });
    expect(genericResponse.totalHits).toBe(0);
  });
});
