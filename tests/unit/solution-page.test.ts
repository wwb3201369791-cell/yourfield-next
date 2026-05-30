import { describe, expect, it } from 'vitest';

import { buildSolutionsPageSections, type SolutionPageSource } from '@/lib/content/solutionPage';

const solution = (overrides: Partial<SolutionPageSource> = {}): SolutionPageSource => ({
  features: ['风险识别', '配置建议'],
  href: '/products',
  id: 'power-energy',
  image: '/images/solutions/solution-power-grid.jpg',
  order: 1,
  productTags: ['防电弧服', '绝缘手套'],
  summary: '围绕电力作业风险配置防护方案。',
  title: '电力电网作业',
  ...overrides,
});

describe('solution page sections', () => {
  it('does not fabricate static solution content when CMS has no published records', () => {
    const sections = buildSolutionsPageSections([]);

    expect(sections.isEmpty).toBe(true);
    expect(sections.detailCards).toEqual([]);
  });

  it('uses the CMS solutions as the four main solution cards sorted by order', () => {
    const sections = buildSolutionsPageSections([
      solution({ id: 'power-energy', order: 2, title: '电力与能源' }),
      solution({
        id: 'petrochemical',
        order: 3,
        productTags: ['防化服'],
        title: '石油石化',
      }),
      solution({ id: 'emergency-response', order: 1, title: '应急救援' }),
    ]);

    expect(sections.isEmpty).toBe(false);
    expect(sections.detailCards.map((card) => card.id)).toEqual([
      'emergency-response',
      'power-energy',
      'petrochemical',
    ]);
  });

  it('keeps core product tags on the solution detail cards', () => {
    const sections = buildSolutionsPageSections([solution()]);

    expect(sections.detailCards[0]?.productTags).toEqual(['防电弧服', '绝缘手套']);
  });
});
