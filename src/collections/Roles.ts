import type { CollectionConfig } from 'payload';

import { canCreate, canDelete, canRead, canUpdate } from '../lib/payload/access';
import { adminLabel } from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';

const superAdminPermissions = {
  '*': {
    read: true,
    create: true,
    update: true,
    delete: true,
    publish: true,
  },
};

export const Roles: CollectionConfig = {
  slug: 'roles',
  labels: {
    singular: adminLabel('角色'),
    plural: adminLabel('角色'),
  },
  admin: {
    useAsTitle: 'name',
    group: adminLabel('系统设置'),
    hidden: true,
  },
  access: {
    read: canRead('roles'),
    create: canCreate('roles'),
    update: canUpdate('roles'),
    delete: canDelete('roles'),
  },
  hooks: {
    afterChange: [auditAfterChange('roles')],
    afterDelete: [auditAfterDelete('roles')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'permissions',
      type: 'json',
      required: true,
      defaultValue: superAdminPermissions,
      admin: {
        description: adminLabel('权限矩阵预留；一期 super-admin 使用 * 全权限。'),
      },
    },
  ],
};
