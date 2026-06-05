import type { Access } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { Users } from '@/collections/Users';

type AccessRequest = Parameters<Access>[0]['req'];

const superAdminReq = {
  context: {},
  payload: {
    findByID: vi.fn(),
  },
  user: {
    id: 'user-1',
    role: {
      slug: 'super-admin',
    },
  },
} as unknown as AccessRequest;

const getField = (name: string) =>
  Users.fields.find((field) => 'name' in field && field.name === name);

describe('Users admin configuration', () => {
  it('keeps account management hidden from navigation and disables user lifecycle changes', async () => {
    expect(Users.admin?.hidden).toBe(true);

    await expect(Promise.resolve(Users.access?.create?.({ req: superAdminReq }))).resolves.toBe(
      false,
    );
    await expect(Promise.resolve(Users.access?.delete?.({ req: superAdminReq }))).resolves.toBe(
      false,
    );
  });

  it('hides role editing controls from the current account page', () => {
    const roleField = getField('role');
    const admin = roleField?.admin as { allowCreate?: boolean; hidden?: boolean } | undefined;

    expect(roleField).toBeDefined();
    expect(admin?.hidden).toBe(true);
    expect(admin?.allowCreate).toBe(false);
  });

  it('locks the admin account for five minutes after five failed login attempts', () => {
    expect(Users.auth).toMatchObject({
      lockTime: 5 * 60 * 1000,
      maxLoginAttempts: 5,
    });
  });
});
