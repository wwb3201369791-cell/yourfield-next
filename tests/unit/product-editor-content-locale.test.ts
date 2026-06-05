import { describe, expect, it } from 'vitest';

import {
  productEditorContentLocaleFromSearch,
  resolveProductEditorContentLocale,
} from '@/components/admin/product-editor/productEditorContentLocale';

describe('resolveProductEditorContentLocale', () => {
  it('prioritizes an explicit admin URL locale over Payload locale hook state', () => {
    expect(resolveProductEditorContentLocale({ payloadLocaleCode: 'zh', queryLocale: 'en' })).toBe(
      'en',
    );
    expect(resolveProductEditorContentLocale({ payloadLocaleCode: 'zh', queryLocale: 'ru' })).toBe(
      'ru',
    );
  });

  it('falls back to the Payload locale hook and then Chinese', () => {
    expect(resolveProductEditorContentLocale({ payloadLocaleCode: 'en', queryLocale: null })).toBe(
      'en',
    );
    expect(
      resolveProductEditorContentLocale({ payloadLocaleCode: undefined, queryLocale: 'invalid' }),
    ).toBe('zh');
  });

  it('reads explicit locale from the live browser search string', () => {
    expect(productEditorContentLocaleFromSearch('?locale=en&fallback-locale=null')).toBe('en');
    expect(productEditorContentLocaleFromSearch('?fallback-locale=null&locale=ru')).toBe('ru');
    expect(productEditorContentLocaleFromSearch('?locale=fr')).toBeNull();
  });
});
