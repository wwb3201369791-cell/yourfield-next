import { describe, expect, it } from 'vitest';

import { backfillProductEnRuTranslationsSql } from '@/migrations/20260531_190000_backfill_product_en_ru_translations';

const hanTextPattern = /[\u3400-\u9fff]/u;

const requiredRepresentativeProductIds = [
  '1-ji-fang-dian-hu-fu-chen-shan-kuan',
  'firefighter-suit-combat',
  'official-hyf-3537',
  'medical-protective-clothing',
  'dry-water-rescue-suit-hyf-9905',
];

describe('product English/Russian translation backfill migration', () => {
  it('backfills both English and Russian names and descriptions for every storefront product row', () => {
    const rowPattern = /\('([^']+)', '([^']+)', '([^']+)', '([^']+)'\)/g;
    const rows = Array.from(backfillProductEnRuTranslationsSql.matchAll(rowPattern)).map(
      (match) => ({
        productId: match[1],
        locale: match[2],
        name: match[3],
        description: match[4],
      }),
    );

    const productIds = new Set(rows.map((row) => row.productId));

    expect(rows).toHaveLength(68);
    expect(productIds.size).toBe(34);

    for (const productId of productIds) {
      expect(
        rows
          .filter((row) => row.productId === productId)
          .map((row) => row.locale)
          .sort(),
      ).toEqual(['en', 'ru']);
    }

    for (const requiredProductId of requiredRepresentativeProductIds) {
      expect(productIds.has(requiredProductId)).toBe(true);
    }
  });

  it('does not seed Chinese text into English or Russian public product fields', () => {
    expect(hanTextPattern.test(backfillProductEnRuTranslationsSql)).toBe(false);
  });

  it('uses an idempotent upsert against products_locales', () => {
    expect(backfillProductEnRuTranslationsSql).toContain(
      'ON CONFLICT (_locale, _parent_id) DO UPDATE',
    );
    expect(backfillProductEnRuTranslationsSql).toContain('JOIN products ON products.product_id');
  });
});
