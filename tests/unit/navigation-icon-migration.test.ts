import { describe, expect, it } from 'vitest';

import { navigationIconColumnsSql } from '@/migrations/20260530_090000_navigation_icon_columns';

describe('navigation icon migration', () => {
  it('adds direct icon columns for every navigation item table', () => {
    expect(navigationIconColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "navigation_main_nav" ADD COLUMN IF NOT EXISTS "icon_id" integer',
    );
    expect(navigationIconColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "navigation_footer_nav_items_children" ADD COLUMN IF NOT EXISTS "icon_id" integer',
    );
    expect(navigationIconColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "navigation_mobile_nav_children" ADD COLUMN IF NOT EXISTS "icon_id" integer',
    );
  });

  it('backfills nested icon paths from existing navigation relations', () => {
    expect(navigationIconColumnsSql).toContain("'mainNav.'");
    expect(navigationIconColumnsSql).toContain("'footerNav.'");
    expect(navigationIconColumnsSql).toContain("'mobileNav.'");
    expect(navigationIconColumnsSql).toContain(
      '"navigation_main_nav_children_icon_id_media_id_fk"',
    );
  });
});
