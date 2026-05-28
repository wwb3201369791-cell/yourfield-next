import { describe, expect, it } from 'vitest';

import {
  directOrderPositionTargets,
  directOrderPositionsSql,
  normalizeDirectOrderSql,
} from '@/migrations/20260528_000000_direct_order_positions';

describe('direct order positions migration', () => {
  it('normalizes legacy stepped order tables to direct 1-based positions', () => {
    expect(directOrderPositionTargets).toEqual([
      { columnName: 'order', tableName: 'solutions' },
      { columnName: 'order', tableName: 'product_groups' },
      { columnName: 'order', tableName: 'product_categories' },
      { columnName: 'order', tableName: 'faqs' },
      { columnName: 'display_order', tableName: 'products' },
    ]);

    const sql = normalizeDirectOrderSql({ columnName: 'order', tableName: 'solutions' });

    expect(sql).toContain('ROW_NUMBER() OVER (ORDER BY "order" ASC, "id" ASC)');
    expect(sql).toContain('BOOL_AND("order" >= 10 AND "order" % 10 = 0)');
    expect(sql).toContain('UPDATE "solutions" AS target');
  });

  it('includes every operator-facing frontend order table', () => {
    for (const { columnName, tableName } of directOrderPositionTargets) {
      expect(directOrderPositionsSql).toContain(`FROM "${tableName}"`);
      expect(directOrderPositionsSql).toContain(`UPDATE "${tableName}" AS target`);
      expect(directOrderPositionsSql).toContain(
        `"${columnName}" = eligible_order_rows.direct_order`,
      );
    }
  });
});
