import { describe, expect, it } from 'vitest';

import { Media } from '@/collections/Media';

describe('media upload quality settings', () => {
  it('preserves uploaded product material image originals instead of forcing WebP conversion', () => {
    expect(Media.upload).toBeTypeOf('object');
    expect(typeof Media.upload === 'object' ? Media.upload.formatOptions : undefined).toBeUndefined();
  });
});
