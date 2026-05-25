import { describe, expect, it } from 'vitest';

import { adminRedirectTarget, createExactAdminRedirectPattern } from '@/lib/payload/adminRedirect';

describe('Payload admin redirect helpers', () => {
  it('redirects the exact admin path to the trailing-slash admin path', () => {
    expect(adminRedirectTarget('/admin', '/admin')).toBe('/admin/');
    expect(adminRedirectTarget('/admin', '/admin?next=%2Fadmin%2Fcollections')).toBe(
      '/admin/?next=%2Fadmin%2Fcollections',
    );
  });

  it('does not redirect the already-normalized admin path', () => {
    expect(adminRedirectTarget('/admin', '/admin/')).toBeNull();
    expect(adminRedirectTarget('/admin', '/admin/login')).toBeNull();
  });

  it('matches only the exact admin path', () => {
    const pattern = createExactAdminRedirectPattern('/admin');

    expect(pattern.test('/admin')).toBe(true);
    expect(pattern.test('/admin/')).toBe(false);
    expect(pattern.test('/admin/login')).toBe(false);
  });
});
