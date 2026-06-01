import { describe, expect, it } from 'vitest';

import {
  canonicalHostFromSiteUrl,
  shouldRedirectToCanonicalHost,
} from '@/lib/security/canonicalHost';

describe('proxy canonical host binding', () => {
  it('normalizes the configured site URL host for canonical binding', () => {
    expect(canonicalHostFromSiteUrl('https://yourfieldsafety.com')).toBe('yourfieldsafety.com');
    expect(canonicalHostFromSiteUrl('https://YOURFIELDSAFETY.com:443')).toBe('yourfieldsafety.com');
  });

  it('forces production requests from the server IP or non-canonical host back to the canonical domain', () => {
    expect(
      shouldRedirectToCanonicalHost({
        canonicalHost: 'yourfieldsafety.com',
        nodeEnv: 'production',
        requestHost: '18.143.91.238',
      }),
    ).toBe(true);

    expect(
      shouldRedirectToCanonicalHost({
        canonicalHost: 'yourfieldsafety.com',
        nodeEnv: 'production',
        requestHost: 'www.yourfieldsafety.com',
      }),
    ).toBe(true);
  });

  it('does not redirect canonical production requests or local development requests', () => {
    expect(
      shouldRedirectToCanonicalHost({
        canonicalHost: 'yourfieldsafety.com',
        nodeEnv: 'production',
        requestHost: 'yourfieldsafety.com',
      }),
    ).toBe(false);

    expect(
      shouldRedirectToCanonicalHost({
        canonicalHost: 'yourfieldsafety.com',
        nodeEnv: 'development',
        requestHost: 'localhost:3000',
      }),
    ).toBe(false);
  });
});
