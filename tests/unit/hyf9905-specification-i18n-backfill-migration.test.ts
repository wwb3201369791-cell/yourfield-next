import { describe, expect, it } from 'vitest';

import { backfillHyf9905SpecificationI18nSql } from '@/migrations/20260605_001000_backfill_hyf9905_specification_i18n';

describe('HYF-9905 specification i18n backfill migration', () => {
  it('fills localized specification labels and values for all public product locales', () => {
    expect(backfillHyf9905SpecificationI18nSql).toContain('dry-water-rescue-suit-hyf-9905');
    expect(backfillHyf9905SpecificationI18nSql).toContain('products_specifications_locales');
    expect(backfillHyf9905SpecificationI18nSql).toContain("'zh'::_locales, '货号', 'HYF-9905'");
    expect(backfillHyf9905SpecificationI18nSql).toContain("'en'::_locales, 'Item No.', 'HYF-9905'");
    expect(backfillHyf9905SpecificationI18nSql).toContain("'ru'::_locales, 'Артикул', 'HYF-9905'");
    expect(backfillHyf9905SpecificationI18nSql).toContain("'en'::_locales, 'Color', 'Red'");
    expect(backfillHyf9905SpecificationI18nSql).toContain(
      "'ru'::_locales, 'Протокол испытаний', 'Есть соответствующий протокол испытаний производителя'",
    );
  });
});
