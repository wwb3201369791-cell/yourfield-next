import { describe, expect, it } from 'vitest';

import {
  defaultAdminContentLocaleUrl,
  isPayloadAdminEditPath,
  markAdminContentLocaleIntent,
} from '@/components/admin/adminContentLocaleState';

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  } satisfies Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;
}

describe('admin content locale reset', () => {
  it('detects Payload edit pages without treating list pages as content editors', () => {
    expect(isPayloadAdminEditPath('/admin/globals/site-settings')).toBe(true);
    expect(isPayloadAdminEditPath('/admin/collections/products/42')).toBe(true);
    expect(isPayloadAdminEditPath('/admin/collections/products')).toBe(false);
    expect(isPayloadAdminEditPath('/admin')).toBe(false);
  });

  it('resets carried content locale to Chinese when entering another edit page', () => {
    const storage = createStorage();

    markAdminContentLocaleIntent('/admin/globals/site-settings', 'ru', {
      now: 1000,
      storage,
    });

    expect(
      defaultAdminContentLocaleUrl(
        {
          hash: '',
          pathname: '/admin/collections/products/42',
          search: '?locale=ru&fallback-locale=null',
        },
        { now: 1100, storage },
      ),
    ).toBe('/admin/collections/products/42?locale=zh&fallback-locale=null');
  });

  it('keeps an intentional locale switch on the current edit page', () => {
    const storage = createStorage();

    markAdminContentLocaleIntent('/admin/globals/site-settings', 'en', {
      now: 1000,
      storage,
    });

    expect(
      defaultAdminContentLocaleUrl(
        {
          hash: '',
          pathname: '/admin/globals/site-settings',
          search: '?locale=en&fallback-locale=null',
        },
        { now: 1100, storage },
      ),
    ).toBeNull();
  });
});
