import { describe, expect, it } from 'vitest';

import { validateLocalizedAlt } from '../validateLocalizedAlt';

type HookArgs = Parameters<typeof validateLocalizedAlt>[0];

function runValidateLocalizedAlt(data: HookArgs['data'], locale = 'zh') {
  return validateLocalizedAlt({
    data,
    req: { locale },
  } as unknown as HookArgs) as unknown;
}

describe('validateLocalizedAlt', () => {
  it('keeps scalar alt values so Payload can validate localized text fields', () => {
    expect(runValidateLocalizedAlt({ alt: '消防员灭火防护服 产品图片' })).toEqual({
      alt: '消防员灭火防护服 产品图片',
    });
  });

  it('converts legacy localized alt objects to the current locale scalar', () => {
    expect(
      runValidateLocalizedAlt(
        {
          alt: {
            en: 'Fire suit product image',
            ru: 'Fire suit product image',
            zh: '消防员灭火防护服 产品图片',
          },
        },
        'en',
      ),
    ).toEqual({ alt: 'Fire suit product image' });
  });

  it('uses filename fallback when no valid alt text is provided', () => {
    expect(runValidateLocalizedAlt({ alt: { zh: '' }, filename: 'front-view.webp' })).toEqual({
      alt: 'front view 产品图片',
      filename: 'front-view.webp',
    });
  });
});
