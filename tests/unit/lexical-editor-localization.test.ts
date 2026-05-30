import { describe, expect, it } from 'vitest';

import { localizeLexicalFeatures } from '@/lib/payload/localizeLexicalEditor';

describe('Lexical editor compatibility shim', () => {
  it('leaves Payload 3 lexical feature providers unchanged', () => {
    const providers = [{ key: 'paragraph' }, { key: 'heading' }];

    expect(localizeLexicalFeatures(providers)).toBe(providers);
  });
});
