import type {
  BeforeChangeHook,
  BeforeOperationHook,
} from 'payload/dist/collections/config/types';
import { Forbidden } from 'payload/errors';
import type { CollectionConfig } from 'payload/types';

import { env } from '../lib/env';
import {
  canRead,
  deny,
  isAdminOrSelf,
  isSuperAdminField,
} from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';

type LoginOperationArgs = {
  data?: {
    email?: unknown;
  };
};

const normalizeLocalSuperadminLogin: BeforeOperationHook = (hookArgs) => {
  const loginArgs = hookArgs.args as LoginOperationArgs | undefined;

  if (hookArgs.operation !== 'login' || !env.SUPERADMIN_USERNAME || !env.SUPERADMIN_EMAIL) {
    return undefined;
  }

  const submittedAccount = loginArgs?.data?.email;
  if (typeof submittedAccount !== 'string') {
    return undefined;
  }

  if (submittedAccount.trim().toLowerCase() !== env.SUPERADMIN_USERNAME.trim().toLowerCase()) {
    return undefined;
  }

  return {
    ...loginArgs,
    data: {
      ...(loginArgs?.data ?? {}),
      email: env.SUPERADMIN_EMAIL,
    },
  };
};

const getDocumentId = (id: unknown): string | undefined =>
  typeof id === 'string' || typeof id === 'number'
    ? String(id)
    : id && typeof id === 'object' && 'id' in id
      ? getDocumentId((id as { id?: unknown }).id)
      : undefined;

const preventSelfRoleChange: BeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation !== 'update' || !data || !('role' in data)) {
    return data;
  }

  const currentUser = req.user as { id?: unknown } | null | undefined;
  const originalUser = originalDoc as { id?: unknown; role?: unknown } | undefined;
  const userId = getDocumentId(currentUser?.id);
  const documentId = getDocumentId(originalUser?.id);

  if (!userId || !documentId || userId !== documentId) {
    return data;
  }

  const nextRole = getDocumentId(data.role);
  const currentRole = getDocumentId(originalUser?.role);

  if (nextRole && nextRole !== currentRole) {
    throw new Forbidden(req.t);
  }

  return data;
};

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: '后台用户',
    plural: '后台用户',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useAPIKey: false,
    cookies: {
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    },
  },
  admin: {
    useAsTitle: 'email',
    group: '系统设置',
    hidden: true,
  },
  access: {
    read: canRead('users'),
    create: deny,
    update: isAdminOrSelf,
    delete: deny,
  },
  hooks: {
    beforeOperation: [normalizeLocalSuperadminLogin],
    beforeChange: [preventSelfRoleChange],
    afterChange: [auditAfterChange('users')],
    afterDelete: [auditAfterDelete('users')],
  },
  fields: [
    {
      name: 'name',
      label: '姓名',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: '角色',
      type: 'relationship',
      relationTo: 'roles',
      required: true,
      access: {
        create: isSuperAdminField,
        update: isSuperAdminField,
      },
      admin: {
        allowCreate: false,
        description: '选择后台权限角色。',
        hidden: true,
      },
    },
    {
      name: 'lastLoginAt',
      label: '上次登录时间',
      type: 'date',
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
        description: 'P2.S4/P4 登录 hook 自动维护。',
      },
    },
    {
      name: 'twoFactorEnabled',
      label: '启用二次验证',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
        position: 'sidebar',
        description: 'P4 启用二次验证时使用。',
      },
    },
    {
      name: 'twoFactorSecret',
      label: '二次验证密钥',
      type: 'text',
      admin: {
        hidden: true,
        position: 'sidebar',
        description: 'P4 启用后需加密存储；不要在日志中输出。',
      },
    },
    {
      name: 'deletedAt',
      label: '删除标记时间',
      type: 'date',
      admin: {
        hidden: true,
        position: 'sidebar',
        description: '软删除标记；保留审计追溯。',
      },
    },
  ],
};
