import { describe, expect, it } from 'vitest';

import { buildHomeProductScenarios } from '@/lib/home/productScenarios';
import type { Product } from '@/lib/product/types';

const text = (zh: string, en = zh, ru = zh) => ({ zh, en, ru });

function product(overrides: Partial<Product>): Product {
  const id = overrides.id ?? 'product';
  const image = overrides.image ?? `/images/${id}.png`;

  return {
    applications: [],
    categoryId: overrides.categoryId ?? id,
    categoryName: overrides.categoryName ?? text('产品大类'),
    description: overrides.description ?? text('产品说明'),
    faqs: [],
    features: overrides.features ?? [],
    groupId: overrides.groupId ?? 'fire-rescue',
    id,
    image,
    images: overrides.images ?? [image],
    materials: [],
    model: overrides.model ?? id,
    name: overrides.name ?? text(id),
    specifications: [],
    standards: overrides.standards ?? [],
    ...overrides,
  };
}

describe('home product scenarios', () => {
  it('derives tab order from CMS featured product group order instead of the static homepage fallback', () => {
    const scenarios = buildHomeProductScenarios(
      [
        product({
          categoryName: text('电力电弧与电磁防护', 'Electrical arc and EM protection'),
          groupId: 'electrical-protection',
          id: 'arc-flash-suit',
        }),
        product({
          categoryName: text('消防与应急救援防护', 'Fire and emergency rescue protection'),
          groupId: 'fire-rescue',
          id: 'firefighter-suit',
        }),
        product({
          categoryName: text('电力电弧与电磁防护', 'Electrical arc and EM protection'),
          groupId: 'electrical-protection',
          id: 'arc-flash-suit-second',
        }),
        product({
          categoryName: text('热工防护', 'Thermal protection'),
          groupId: 'thermal-welding',
          id: 'welding-suit',
        }),
      ],
      'zh',
    );

    expect(scenarios).toEqual([
      { group: 'electrical-protection', label: '电力电弧与电磁防护' },
      { group: 'fire-rescue', label: '消防与应急救援防护' },
      { group: 'thermal-welding', label: '热工防护' },
    ]);
  });
});
