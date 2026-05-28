import { describe, expect, it } from 'vitest';

import type { SearchCandidate } from '../search-candidates';
import { snippetFor } from '../search-snippets';

const baseCandidate: SearchCandidate = {
  categoryKeys: [],
  excerpt: '默认摘要',
  fields: [],
  id: 'candidate:snippet',
  title: '默认标题',
  type: 'product',
  url: '/zh/products/snippet',
};

describe('search snippets', () => {
  it('returns the first matching searchable field', () => {
    const snippet = snippetFor(
      {
        ...baseCandidate,
        fields: [
          { text: '不相关字段', weight: 1 },
          { text: '适用于森林消防和抢险救援场景', weight: 1 },
        ],
      },
      '消防',
    );

    expect(snippet).toBe('适用于森林消防和抢险救援场景');
  });

  it('falls back to excerpt and then title when no field matches', () => {
    expect(
      snippetFor(
        {
          ...baseCandidate,
          excerpt: '产品摘要',
          fields: [{ text: '无关字段', weight: 1 }],
        },
        '消防',
      ),
    ).toBe('产品摘要');

    expect(
      snippetFor(
        {
          ...baseCandidate,
          excerpt: '',
          title: '产品标题',
          fields: [{ text: '无关字段', weight: 1 }],
        },
        '消防',
      ),
    ).toBe('产品标题');
  });

  it('normalizes full-width query text before matching', () => {
    expect(
      snippetFor(
        {
          ...baseCandidate,
          fields: [{ text: '型号 HYF 5506 消防服', weight: 1 }],
        },
        'ｈｙｆ　５５０６',
      ),
    ).toBe('型号 HYF 5506 消防服');
  });
});
