import { describe, expect, it } from 'vitest';

import { categorySearchHrefFor } from '@/lib/search/categoryNavigation';

describe('category search navigation', () => {
  it('opens clear category intent in the matching product center section', () => {
    expect(categorySearchHrefFor('zh', '消防救援防护')).toBe('/zh/products#fire-rescue');
    expect(categorySearchHrefFor('zh', '防电弧服')).toBe('/zh/products#electrical-protection');
    expect(categorySearchHrefFor('zh', '焊接防护')).toBe('/zh/products#thermal-welding');
    expect(categorySearchHrefFor('zh', '防化服')).toBe('/zh/products#chemical-medical');
    expect(categorySearchHrefFor('zh', '水域救援')).toBe('/zh/products#water-rescue');
  });

  it('keeps broad terms on the search results page for user filtering', () => {
    expect(categorySearchHrefFor('zh', '消防')).toBeNull();
    expect(categorySearchHrefFor('zh', '防护服')).toBeNull();
    expect(categorySearchHrefFor('zh', '装备')).toBeNull();
  });
});
