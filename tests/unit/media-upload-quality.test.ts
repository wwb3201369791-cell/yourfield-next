import { describe, expect, it } from 'vitest';

import { Media } from '@/collections/Media';

describe('media upload quality settings', () => {
  it('serves the checked-in local media library from src/uploads in dev/admin smoke tests', () => {
    expect(Media.upload).toBeTypeOf('object');
    expect(typeof Media.upload === 'object' ? Media.upload.staticDir : undefined).toBe(
      'src/uploads',
    );
  });

  it('preserves uploaded product material image originals instead of forcing WebP conversion', () => {
    expect(Media.upload).toBeTypeOf('object');
    expect(
      typeof Media.upload === 'object' ? Media.upload.formatOptions : undefined,
    ).toBeUndefined();
  });
});
