import { describe, expect, it, vi } from 'vitest';

import {
  normalizeAdminListPreferenceValue,
  statusPreferenceKeys,
  up,
} from '@/migrations/20260525_010000_admin_status_preferences';

describe('admin status preference migration', () => {
  it('replaces legacy _status columns with a single statusBadge column', () => {
    expect(
      normalizeAdminListPreferenceValue({
        columns: [
          { accessor: 'model', active: true },
          { accessor: '_status', active: true },
          { accessor: 'statusBadge', active: true },
          { accessor: 'publishedAt', active: true },
        ],
      }),
    ).toEqual({
      columns: [
        { accessor: 'model', active: true },
        { accessor: 'statusBadge', active: true },
        { accessor: 'publishedAt', active: true },
      ],
    });
  });

  it('keeps the status badge active when any old status column was active', () => {
    expect(
      normalizeAdminListPreferenceValue({
        columns: [
          { accessor: '_status', active: false },
          { accessor: 'statusBadge', active: true },
        ],
      }),
    ).toEqual({
      columns: [{ accessor: 'statusBadge', active: true }],
    });
  });

  it('adds statusBadge to stale list preferences that only contain the old visible columns', () => {
    expect(
      normalizeAdminListPreferenceValue({
        columns: [
          { accessor: 'model', active: true },
          { accessor: 'name', active: true },
          { accessor: 'publishedAt', active: true },
        ],
      }),
    ).toEqual({
      columns: [
        { accessor: 'model', active: true },
        { accessor: 'name', active: true },
        { accessor: 'statusBadge', active: true },
        { accessor: 'publishedAt', active: true },
      ],
    });
  });

  it('does not rewrite unrelated preference payloads', () => {
    const preference = { fields: { hero: { collapsed: true } } };

    expect(normalizeAdminListPreferenceValue(preference)).toBe(preference);
  });

  it('updates only changed product/news/solution list preferences through the Payload pool', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            value: {
              columns: [{ accessor: '_status', active: true }],
            },
          },
          {
            id: 2,
            value: {
              columns: [{ accessor: 'statusBadge', active: true }],
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
      [statusPreferenceKeys],
    );
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE "payload_preferences"'),
      [JSON.stringify({ columns: [{ accessor: 'statusBadge', active: true }] }), 1],
    );
  });
});
