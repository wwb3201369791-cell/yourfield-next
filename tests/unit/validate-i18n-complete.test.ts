import { describe, expect, it, vi } from 'vitest';

import { env } from '@/lib/env';
import { requireAllLocalesOnPublish } from '@/lib/payload/hooks/validateI18nComplete';

const locales = ['zh', 'en', 'ru'] as const;
type HookArgs = Parameters<ReturnType<typeof requireAllLocalesOnPublish>>[0];

const collection = {
  slug: 'test-pages',
  fields: [
    {
      name: 'title',
      label: '页面标题',
      type: 'text',
      localized: true,
    },
    {
      name: 'content',
      label: '正文',
      type: 'richText',
      localized: true,
    },
  ],
} as unknown as HookArgs['collection'];

const req = {
  locale: 'zh',
  payload: {
    config: {
      localization: {
        defaultLocale: 'zh',
      },
    },
    logger: {
      warn: vi.fn(),
    },
  },
} as unknown as HookArgs['req'];

describe('requireAllLocalesOnPublish', () => {
  it('rejects published documents when another locale is missing', async () => {
    const hook = requireAllLocalesOnPublish(locales);

    await expect(
      hook({
        collection,
        context: {},
        data: {
          _status: 'published',
          title: '中文标题',
          content: {
            root: {
              children: [{ children: [{ text: '中文正文' }] }],
            },
          },
        },
        operation: 'create',
        req,
      }),
    ).rejects.toThrow('无法发布');
  });

  it('does not reject draft documents with missing translations', async () => {
    const hook = requireAllLocalesOnPublish(locales);

    await expect(
      hook({
        collection,
        context: {},
        data: {
          _status: 'draft',
          title: '中文标题',
        },
        operation: 'create',
        req,
      }),
    ).resolves.toMatchObject({ _status: 'draft' });
  });

  it('treats rich text with only empty text nodes as missing', async () => {
    const hook = requireAllLocalesOnPublish(locales);

    await expect(
      hook({
        collection,
        context: {},
        data: {
          _status: 'published',
          title: '中文标题',
          content: {
            root: {
              children: [{ children: [{ text: '   ' }] }],
            },
          },
        },
        operation: 'create',
        req,
      }),
    ).rejects.toThrow('正文');
  });

  it('allows seed mode to perform multi-step locale backfills before the final document is complete', async () => {
    const hook = requireAllLocalesOnPublish(locales);
    const originalSeedModeValue = env.PAYLOAD_SEED_MODE;

    env.PAYLOAD_SEED_MODE = true;

    try {
      await expect(
        hook({
          collection,
          context: {},
          data: {
            _status: 'published',
            title: '中文标题',
          },
          operation: 'create',
          req,
        }),
      ).resolves.toMatchObject({ _status: 'published' });
    } finally {
      env.PAYLOAD_SEED_MODE = originalSeedModeValue;
    }
  });

  it('only warns when strict publish validation is disabled', async () => {
    const hook = requireAllLocalesOnPublish(locales);
    const originalStrictValue = env.STRICT_I18N_PUBLISH;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    env.STRICT_I18N_PUBLISH = false;

    try {
      await expect(
        hook({
          collection,
          context: {},
          data: {
            _status: 'published',
            title: '中文标题',
          },
          operation: 'create',
          req,
        }),
      ).resolves.toMatchObject({ _status: 'published' });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('无法发布'));
    } finally {
      env.STRICT_I18N_PUBLISH = originalStrictValue;
      warn.mockRestore();
    }
  });
});
