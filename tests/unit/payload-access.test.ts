import type { Access } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import {
  canDelete,
  canUpdate,
  isAdmin,
  isAdminOrPublished,
  isAdminOrSelf,
} from '@/lib/payload/access';

type AccessRequest = Parameters<Access>[0]['req'];
type RoleDocument = Record<string, unknown>;

const makeReq = (
  user: Record<string, unknown> | null,
  roles: Record<string, RoleDocument> = {},
): AccessRequest =>
  ({
    context: {},
    payload: {
      findByID: vi.fn(({ id }: { id: string }) => Promise.resolve(roles[id] ?? null)),
    },
    user,
  }) as unknown as AccessRequest;

describe('Payload RBAC access helpers', () => {
  it('does not treat a logged-in user without an admin role as an admin', async () => {
    const req = makeReq({ id: 'user-1' });

    await expect(isAdmin({ req })).resolves.toBe(false);
  });

  it('allows super-admin users to pass admin and collection permission checks', async () => {
    const req = makeReq({
      id: 'user-1',
      role: {
        slug: 'super-admin',
      },
    });

    await expect(isAdmin({ req })).resolves.toBe(true);
    await expect(canDelete('users')({ req })).resolves.toBe(true);
  });

  it('allows scoped role permissions without requiring super-admin', async () => {
    const req = makeReq(
      {
        id: 'user-1',
        role: 'role-1',
      },
      {
        'role-1': {
          permissions: {
            products: {
              update: true,
            },
          },
          slug: 'catalog-editor',
        },
      },
    );

    await expect(canUpdate('products')({ req })).resolves.toBe(true);
    await expect(canDelete('products')({ req })).resolves.toBe(false);
  });

  it('keeps self-service profile updates available without granting cross-user admin access', async () => {
    const req = makeReq({ id: 'user-1' });

    await expect(isAdminOrSelf({ id: 'user-1', req })).resolves.toBe(true);
    await expect(isAdminOrSelf({ id: 'user-2', req })).resolves.toBe(false);
  });

  it('only returns published content filters to anonymous readers', async () => {
    const req = makeReq(null);

    await expect(isAdminOrPublished({ req })).resolves.toEqual({
      _status: {
        equals: 'published',
      },
    });
  });
});
