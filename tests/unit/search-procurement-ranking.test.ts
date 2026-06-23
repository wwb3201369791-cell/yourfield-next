import { describe, expect, it } from 'vitest';

import { searchContent } from '@/lib/search/search';
import type { SearchSourceProvider, SearchSources } from '@/lib/search/types';

const emptySources: Omit<SearchSources, 'products'> = {
  faqs: [],
  industryCases: [],
  news: [],
  pages: [],
  solutions: [],
};

describe('procurement-intent search ranking', () => {
  it('prioritizes products whose title matches the procurement intent over broad group aliases', async () => {
    const sourceProvider: SearchSourceProvider = async () => ({
      ...emptySources,
      products: [
        {
          category: {
            categoryId: 'electrical-protection',
            group: 'electrical-protection',
            name: '电力防护',
          },
          description: '带电作业屏蔽服，适合高压带电检修。',
          id: 'shielding-suit',
          model: 'YF-SHIELD',
          name: '1000kv带电作业用屏蔽服',
          productId: 'live-line-shielding-suit',
          slug: 'live-line-shielding-suit',
        },
        {
          category: {
            categoryId: 'electrical-protection',
            group: 'electrical-protection',
            name: '电力防护',
          },
          description: '防电弧服，适合电力检修与电气作业。',
          id: 'arc-shirt-suit',
          model: 'YF-ARC-1',
          name: '1级防电弧服(衬衫款)',
          productId: 'arc-flash-shirt-suit',
          slug: 'arc-flash-shirt-suit',
        },
      ],
    });

    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '防电弧服厂家',
        type: 'all',
      },
      sourceProvider,
    );

    expect(response.hits.map((hit) => hit.title).slice(0, 2)).toEqual([
      '1级防电弧服(衬衫款)',
      '1000kv带电作业用屏蔽服',
    ]);
  });

  it('keeps incidental flame-retardant material copy from flattening FR procurement results', async () => {
    const sourceProvider: SearchSourceProvider = async () => ({
      ...emptySources,
      products: [
        {
          applications: ['电力电网带电作业中心'],
          description: '带电作业屏蔽服，辅料均采用阻燃材料。',
          features: [{ description: '阻燃材料提升安全性能。' }],
          id: 'shielding-suit',
          materials: ['本质阻燃/金属纤维混纺面料'],
          model: 'YF-SHIELD',
          name: '1000kv带电作业用屏蔽服',
          productId: 'live-line-shielding-suit',
          slug: 'live-line-shielding-suit',
          standards: ['GB/T6568-2008《带电作业用屏蔽服装》'],
        },
        {
          description: '普通防静电服适合电子制造场景。',
          id: 'anti-static-suit',
          model: 'HYF-3201',
          name: '防静电服(春秋款)',
          productId: 'anti-static-workwear',
          slug: 'anti-static-workwear',
          standards: ['GB12014-2019《防护服装防静电服》'],
        },
        {
          description: 'A级阻燃服用于工业热防护场景。',
          id: 'fr-suit',
          model: 'HYF-3105',
          name: 'A级阻燃服',
          productId: 'official-hyf-3105',
          slug: 'official-hyf-3105',
          standards: ['GB8965.1-2020《防护服装阻燃服》'],
        },
      ],
    });

    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '阻燃连体服厂家',
        type: 'product',
      },
      sourceProvider,
    );

    expect(response.hits.map((hit) => hit.title).slice(0, 2)).toEqual([
      'A级阻燃服',
      '防静电服(春秋款)',
    ]);
  });
});
