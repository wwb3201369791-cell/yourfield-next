import { describe, expect, it, vi } from 'vitest';

import {
  normalizeNewsCategoryPreferenceValue,
  up,
} from '@/migrations/20260527_000000_news_category_preferences';

describe('news category preference migration', () => {
  it('removes the category column from saved news list preferences', () => {
    expect(
      normalizeNewsCategoryPreferenceValue({
        columns: [
          { accessor: 'title', active: true },
          { accessor: 'category', active: true },
          { accessor: 'statusBadge', active: true },
          { accessor: 'publishedAt', active: true },
        ],
      }),
    ).toEqual({
      columns: [
        { accessor: 'title', active: true },
        { accessor: 'statusBadge', active: true },
        { accessor: 'publishedAt', active: true },
      ],
    });
  });

  it('does not rewrite unrelated preference payloads', () => {
    const preference = { fields: { hero: { collapsed: true } } };

    expect(normalizeNewsCategoryPreferenceValue(preference)).toBe(preference);
  });

  it('updates only changed news list preferences through the Payload pool', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            value: {
              columns: [
                { accessor: 'title', active: true },
                { accessor: 'category', active: true },
              ],
            },
          },
          {
            id: 2,
            value: {
              columns: [{ accessor: 'title', active: true }],
            },
          },
        ],
      })
      .mockResolvedValue({ rows: [] });

    await up({
      payload: {
        db: {
          pool: { query },
        },
      },
    } as never);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM "payload_preferences"'),
      ['news-list'],
    );
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE "payload_preferences"'),
      [JSON.stringify({ columns: [{ accessor: 'title', active: true }] }), 1],
    );
  });
});
