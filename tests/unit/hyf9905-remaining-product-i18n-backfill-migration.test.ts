import { describe, expect, it } from 'vitest';

import { backfillHyf9905RemainingProductI18nSql } from '@/migrations/20260606_010000_backfill_hyf9905_remaining_product_i18n';

describe('HYF-9905 remaining product i18n backfill migration', () => {
  it('replaces Chinese fallback copy in English and Russian product-detail fields', () => {
    expect(backfillHyf9905RemainingProductI18nSql).toContain('dry-water-rescue-suit-hyf-9905');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_materials');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_features');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_selling_points');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_applications');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_scenarios');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_visual_groups');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_quality_evidence');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_care_instructions');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_size_guide_columns_locales');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('products_size_guide_rows_locales');

    expect(backfillHyf9905RemainingProductI18nSql).toContain(
      "'en'::_locales, 1, 'Dry water rescue protective material'",
    );
    expect(backfillHyf9905RemainingProductI18nSql).toContain(
      "'ru'::_locales, 1, 'Защитный материал сухого костюма для спасения на воде'",
    );
    expect(backfillHyf9905RemainingProductI18nSql).toContain('Low-temperature water protection');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('Защита в холодной воде');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('Available Size');
    expect(backfillHyf9905RemainingProductI18nSql).toContain('Доступный размер');
  });

  it('does not put Chinese Han text into non-Chinese locale update values', () => {
    const nonChineseValueLines = backfillHyf9905RemainingProductI18nSql
      .split('\n')
      .filter((line) => line.includes("'en'::_locales") || line.includes("'ru'::_locales"));

    expect(nonChineseValueLines.join('\n')).not.toMatch(/[\u3400-\u9fff]/u);
  });
});
