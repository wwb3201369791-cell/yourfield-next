import { describe, expect, it } from 'vitest';

import type { SearchCandidate } from '../search-candidates';
import { scoreCandidate, searchTypeOrder } from '../search-scoring';

function candidate(fields: SearchCandidate['fields']): SearchCandidate {
  return {
    categoryKeys: [],
    excerpt: 'fallback excerpt',
    fields,
    id: 'candidate:test',
    title: 'Candidate',
    type: 'product',
    url: '/zh/products/test',
  };
}

describe('search scoring', () => {
  it('weights exact title matches above partial body matches', () => {
    const exact = scoreCandidate(candidate([{ text: '消防服', weight: 3 }]), '消防服');
    const partial = scoreCandidate(
      candidate([{ text: '这是一件消防服，适合抢险救援', weight: 1 }]),
      '消防服',
    );

    expect(exact).toBeGreaterThan(partial);
  });

  it('uses field weights to prioritize model and product identifiers', () => {
    const highWeight = scoreCandidate(candidate([{ text: 'HYF-5506', weight: 3 }]), 'HYF-5506');
    const lowWeight = scoreCandidate(candidate([{ text: 'HYF-5506', weight: 1 }]), 'HYF-5506');

    expect(highWeight).toBe(lowWeight * 3);
  });

  it('scores normalized full-width and lowercase queries consistently', () => {
    const score = scoreCandidate(
      candidate([{ text: 'HYF 5506 消防服', weight: 2 }]),
      'ｈｙｆ　５５０６',
    );

    expect(score).toBeGreaterThan(0);
  });

  it('keeps product results ahead of other search types for stable tie-breaking', () => {
    expect(searchTypeOrder.product).toBeLessThan(searchTypeOrder.solution);
    expect(searchTypeOrder.solution).toBeLessThan(searchTypeOrder.news);
    expect(searchTypeOrder.news).toBeLessThan(searchTypeOrder.faq);
  });
});
