import { describe, expect, it } from 'vitest';

import { isValidGlobalPhoneNumber } from '@/lib/forms/phone';

describe('isValidGlobalPhoneNumber', () => {
  it('accepts common global contact phone formats', () => {
    expect(isValidGlobalPhoneNumber('+44 20 7946 0958')).toBe(true);
    expect(isValidGlobalPhoneNumber('+1 (415) 555-0132')).toBe(true);
    expect(isValidGlobalPhoneNumber('+971 50 123 4567')).toBe(true);
    expect(isValidGlobalPhoneNumber('03-1234-5678')).toBe(true);
    expect(isValidGlobalPhoneNumber('+86 138 0000 0000')).toBe(true);
    expect(isValidGlobalPhoneNumber('+1 212 555 0198 ext. 24')).toBe(true);
  });

  it('rejects incomplete or non-phone values', () => {
    expect(isValidGlobalPhoneNumber('12345')).toBe(false);
    expect(isValidGlobalPhoneNumber('phone: 1234567890')).toBe(false);
    expect(isValidGlobalPhoneNumber('++44 20 7946 0958')).toBe(false);
    expect(isValidGlobalPhoneNumber('+44 20 7946 0958 abc')).toBe(false);
    expect(isValidGlobalPhoneNumber('+1234567890123456')).toBe(false);
  });
});
