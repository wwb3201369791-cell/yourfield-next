import { describe, expect, it } from 'vitest';

import { pagesDirectPageKeyColumnSql } from '@/migrations/20260530_100000_pages_direct_page_key_column';

describe('pages direct page key migration', () => {
  it('adds Payload 3 snake_case page key columns without relying on runtime fallback', () => {
    expect(pagesDirectPageKeyColumnSql).toContain(
      'ALTER TABLE IF EXISTS "pages" ADD COLUMN IF NOT EXISTS "page_key"',
    );
    expect(pagesDirectPageKeyColumnSql).toContain(
      'ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "version_page_key"',
    );
    expect(pagesDirectPageKeyColumnSql).toContain("column_name = 'pageKey'");
    expect(pagesDirectPageKeyColumnSql).toContain('SET "page_key" = "pageKey"');
    expect(pagesDirectPageKeyColumnSql).toContain('pages_page_key_v3_idx');
  });
});
