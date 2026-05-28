import { describe, expect, it } from 'vitest';

import { devPayloadSecret, getPayloadSecret } from '@/lib/payload/secret';

describe('getPayloadSecret', () => {
  it('uses the configured Payload secret when one is present', () => {
    const secret = 'configured-payload-secret-with-enough-length';

    expect(getPayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: secret })).toBe(secret);
  });

  it('uses the dev fallback outside production', () => {
    expect(getPayloadSecret({ NODE_ENV: 'development' })).toBe(devPayloadSecret);
    expect(getPayloadSecret({ NODE_ENV: 'test' })).toBe(devPayloadSecret);
  });

  it('throws in production when PAYLOAD_SECRET is missing', () => {
    expect(() => getPayloadSecret({ NODE_ENV: 'production' })).toThrow(
      'PAYLOAD_SECRET is required in production',
    );
  });

  it('treats empty PAYLOAD_SECRET values as missing', () => {
    expect(() => getPayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: '   ' })).toThrow(
      'PAYLOAD_SECRET is required in production',
    );
  });
});
