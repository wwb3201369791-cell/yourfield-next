import { describe, expect, it, vi } from 'vitest';

import {
  pruneOrphanNewsVersionsSql,
  up,
} from '@/migrations/20260531_010000_prune_orphan_news_versions';

describe('orphan news version cleanup migration', () => {
  it('deletes only version rows that have no live news parent', () => {
    expect(pruneOrphanNewsVersionsSql).toContain('DELETE FROM "_news_v"');
    expect(pruneOrphanNewsVersionsSql).toContain('news_version."parent_id" IS NULL');
    expect(pruneOrphanNewsVersionsSql).not.toContain('DELETE FROM "news"');
    expect(pruneOrphanNewsVersionsSql).not.toContain('news_locales');
  });

  it('runs the cleanup SQL through the Payload Postgres pool', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 35 });

    await up({
      payload: {
        db: {
          pool: { query },
        },
      },
    } as never);

    expect(query).toHaveBeenCalledWith(pruneOrphanNewsVersionsSql);
  });
});
