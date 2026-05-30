import { describe, expect, it } from 'vitest';

import { autoSetPublishedAtOnPublish } from '@/lib/payload/hooks/autoPublishedAt';

const fixedNow = new Date('2026-05-30T02:30:00.000Z');

describe('autoSetPublishedAtOnPublish', () => {
  it('sets the publish timestamp when a draft is published for the first time', async () => {
    const hook = autoSetPublishedAtOnPublish({ now: () => fixedNow });
    const result = await hook({
      data: { _status: 'published', title: 'test' },
      originalDoc: { _status: 'draft' },
    } as never);

    expect(result).toMatchObject({
      _status: 'published',
      publishedAt: fixedNow.toISOString(),
      title: 'test',
    });
  });

  it('preserves an existing publish timestamp', async () => {
    const hook = autoSetPublishedAtOnPublish({ now: () => fixedNow });
    const result = await hook({
      data: { _status: 'published', title: 'test' },
      originalDoc: { _status: 'published', publishedAt: '2026-05-01T00:00:00.000Z' },
    } as never);

    expect(result).toEqual({ _status: 'published', title: 'test' });
  });

  it('does not stamp drafts', async () => {
    const hook = autoSetPublishedAtOnPublish({ now: () => fixedNow });
    const result = await hook({
      data: { _status: 'draft', title: 'test' },
      originalDoc: undefined,
    } as never);

    expect(result).toEqual({ _status: 'draft', title: 'test' });
  });
});
