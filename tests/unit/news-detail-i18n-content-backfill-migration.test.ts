import { describe, expect, it } from 'vitest';

import { backfillNewsDetailI18nContentSql } from '@/migrations/20260606_020000_backfill_news_detail_i18n_content';

describe('news detail i18n content backfill migration', () => {
  it('backfills English and Russian article bodies for all published news items', () => {
    expect(backfillNewsDetailI18nContentSql).toContain('may-day-safety-inspection');
    expect(backfillNewsDetailI18nContentSql).toContain('central-safety-valley');
    expect(backfillNewsDetailI18nContentSql).toContain('party-building-safety-industry');
    expect(backfillNewsDetailI18nContentSql).toContain("'en'::_locales");
    expect(backfillNewsDetailI18nContentSql).toContain("'ru'::_locales");
    expect(backfillNewsDetailI18nContentSql).toContain('Before the May Day holiday');
    expect(backfillNewsDetailI18nContentSql).toContain('Перед первомайскими праздниками');
    expect(backfillNewsDetailI18nContentSql).toContain(
      'Design Empowering Safety and Emergency Equipment',
    );
    expect(backfillNewsDetailI18nContentSql).toContain('Партийное строительство');
  });

  it('does not put Han text into non-Chinese article content rows', () => {
    const nonChineseRows = backfillNewsDetailI18nContentSql
      .split('\n')
      .filter((line) => line.includes("'en'::_locales") || line.includes("'ru'::_locales"));

    expect(nonChineseRows.join('\n')).not.toMatch(/[\u3400-\u9fff]/u);
  });
});
