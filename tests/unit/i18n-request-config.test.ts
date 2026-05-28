import { describe, expect, it } from 'vitest';

import { resolveRequestLocale } from '@/i18n';

describe('next-intl request locale resolution', () => {
  it('keeps supported request locales unchanged', () => {
    expect(resolveRequestLocale('zh')).toBe('zh');
    expect(resolveRequestLocale('en')).toBe('en');
    expect(resolveRequestLocale('ru')).toBe('ru');
  });

  it('falls back to the default locale when root routes have no locale header', () => {
    expect(resolveRequestLocale(undefined)).toBe('zh');
  });

  it('falls back to the default locale for admin paths excluded from locale middleware', () => {
    expect(resolveRequestLocale('admin')).toBe('zh');
  });
});
