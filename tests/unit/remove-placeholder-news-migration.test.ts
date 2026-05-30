import { describe, expect, it } from 'vitest';

import { removePlaceholderNewsSql } from '@/migrations/20260530_120000_remove_placeholder_news';

describe('remove placeholder news migration', () => {
  it('only targets news documents with explicit placeholder copy', () => {
    expect(removePlaceholderNewsSql).toContain('DELETE FROM "news"');
    expect(removePlaceholderNewsSql).toContain('FROM "news_locales"');
    expect(removePlaceholderNewsSql).toContain("ILIKE '%示例：%'");
    expect(removePlaceholderNewsSql).toContain("ILIKE '%待补充%'");
    expect(removePlaceholderNewsSql).toContain("ILIKE 'Example:%'");
    expect(removePlaceholderNewsSql).toContain("ILIKE '%layout sample%'");
  });
});
