import type { Payload } from 'payload';

import type { SeedOptions, SeedResult } from './lib/shared';
import { upsertCollection } from './lib/upsert';

const superAdminPermissions = {
  '*': {
    read: true,
    create: true,
    update: true,
    delete: true,
    publish: true,
  },
};

export const seedSuperadmin = async (payload: Payload, options: SeedOptions): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };
  const role = await upsertCollection({
    collection: 'roles',
    payload,
    options,
    uniqueField: 'slug',
    uniqueValue: 'super-admin',
    data: {
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Seeded super-admin role with full permissions.',
      permissions: superAdminPermissions,
    },
  });

  result.created += role.created;
  result.updated += role.updated;
  result.skipped += role.skipped;

  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[seed] SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD missing; skipped super-admin user creation.');
    result.skipped += 1;
    return result;
  }

  const user = await upsertCollection({
    collection: 'users',
    payload,
    options,
    uniqueField: 'email',
    uniqueValue: email,
    data: {
      email,
      password,
      name: '超级管理员',
      role: /^\d+$/.test(role.id) ? Number(role.id) : role.id,
      twoFactorEnabled: false,
    },
  });

  result.created += user.created;
  result.updated += user.updated;
  result.skipped += user.skipped;

  return result;
};
