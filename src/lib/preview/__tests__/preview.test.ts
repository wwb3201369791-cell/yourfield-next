import { describe, expect, it } from 'vitest';

import {
  isValidPreviewToken,
  parsePreviewRequest,
  previewPathForTarget,
  previewRequestOrigin,
  safeInternalRedirectPath,
} from '@/lib/preview/preview';

describe('preview request parsing', () => {
  it('parses supported collection, locale, slug, and token', () => {
    const result = parsePreviewRequest(
      new URLSearchParams({
        collection: 'products',
        locale: 'en',
        slug: 'firefighter-suit-combat',
        token: 'preview-token',
      }),
    );

    expect(result).toEqual({
      ok: true,
      request: {
        target: {
          collection: 'products',
          locale: 'en',
          slug: 'firefighter-suit-combat',
        },
        token: 'preview-token',
      },
    });
  });

  it('requires a page key or slug for page previews', () => {
    const result = parsePreviewRequest(
      new URLSearchParams({
        collection: 'pages',
        token: 'preview-token',
      }),
    );

    expect(result).toMatchObject({
      code: 'MISSING_TARGET',
      ok: false,
    });
  });

  it('rejects unknown collections and unsafe slugs', () => {
    const unknownCollection = parsePreviewRequest(
      new URLSearchParams({
        collection: 'media',
        slug: 'firefighter-suit-combat',
        token: 'preview-token',
      }),
    );
    const unsafeSlug = parsePreviewRequest(
      new URLSearchParams({
        collection: 'news',
        slug: '../secret',
        token: 'preview-token',
      }),
    );

    expect(unknownCollection).toMatchObject({ code: 'INVALID_COLLECTION', ok: false });
    expect(unsafeSlug).toMatchObject({ code: 'INVALID_SLUG', ok: false });
  });
});

describe('preview paths and redirects', () => {
  it('maps preview targets to locale-scoped public paths', () => {
    expect(
      previewPathForTarget({
        collection: 'pages',
        locale: 'zh',
        pageKey: 'home',
      }),
    ).toBe('/zh');
    expect(
      previewPathForTarget({
        collection: 'pages',
        locale: 'en',
        pageKey: 'products-index',
      }),
    ).toBe('/en/products');
    expect(
      previewPathForTarget({
        collection: 'news',
        locale: 'ru',
        slug: 'company-update',
      }),
    ).toBe('/ru/news/company-update');
  });

  it('allows only locale-scoped internal exit redirects', () => {
    expect(safeInternalRedirectPath('/zh/news/company-update?preview=1')).toBe(
      '/zh/news/company-update?preview=1',
    );
    expect(safeInternalRedirectPath('/admin')).toBe('/zh');
    expect(safeInternalRedirectPath('//evil.example/zh')).toBe('/zh');
    expect(safeInternalRedirectPath('https://evil.example/zh')).toBe('/zh');
    expect(safeInternalRedirectPath('/en/products/firefighter-suit-combat#details')).toBe(
      '/en/products/firefighter-suit-combat#details',
    );
  });

  it('builds preview redirects from allowed forwarded or direct request hosts', () => {
    expect(
      previewRequestOrigin(new Headers({ host: 'localhost:3105' }), 'http://localhost:3000'),
    ).toBe('http://localhost:3105');
    expect(
      previewRequestOrigin(
        new Headers({
          host: 'localhost:3000',
          'x-forwarded-host': 'preview.yourfield.test',
          'x-forwarded-proto': 'https',
        }),
        'http://localhost:3000',
        ['https://preview.yourfield.test'],
      ),
    ).toBe('https://preview.yourfield.test');
    expect(
      previewRequestOrigin(
        new Headers({
          host: 'bad host',
          'x-forwarded-proto': 'ftp',
        }),
        'http://localhost:3000',
      ),
    ).toBe('http://localhost:3000');
  });

  it('falls back when forwarded hosts are not explicitly allowed', () => {
    expect(
      previewRequestOrigin(
        new Headers({
          host: 'www.yourfield.com',
          'x-forwarded-host': 'evil.example',
          'x-forwarded-proto': 'https',
        }),
        'https://www.yourfield.com',
        ['https://www.yourfield.com'],
      ),
    ).toBe('https://www.yourfield.com');
  });
});

describe('preview token validation', () => {
  it('accepts exact token matches without exposing the configured secret', () => {
    expect(isValidPreviewToken('preview-token', 'preview-token')).toBe(true);
    expect(isValidPreviewToken('wrong-token', 'preview-token')).toBe(false);
    expect(isValidPreviewToken(undefined, 'preview-token')).toBe(false);
    expect(isValidPreviewToken('preview-token', undefined)).toBe(false);
  });
});
