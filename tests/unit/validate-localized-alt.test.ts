import { describe, expect, it } from 'vitest';

import { validateLocalizedAlt } from '@/lib/payload/hooks/validateLocalizedAlt';

describe('validateLocalizedAlt', () => {
  it('generates localized alt text from the uploaded filename when editors skip media metadata', () => {
    expect(
      validateLocalizedAlt({
        data: {
          filename: 'solution-petrochemical.webp',
          id: '1',
        },
      } as never) as unknown,
    ).toEqual({
      alt: 'solution petrochemical 产品图片',
      filename: 'solution-petrochemical.webp',
      id: '1',
    });
  });
});
