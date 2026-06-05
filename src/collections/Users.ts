import type {
  CollectionBeforeChangeHook as BeforeChangeHook,
  CollectionBeforeOperationHook as BeforeOperationHook,
  CollectionConfig,
} from 'payload';
import { Forbidden } from 'payload';

import { env } from '../lib/env';
import { canRead, deny, isAdminOrSelf, isSuperAdminField } from '../lib/payload/access';
import { adminCollectionLabel, adminLabel } from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';

const useSecureAuthCookies = env.PAYLOAD_PUBLIC_SERVER_URL.startsWith('https://');

const normalizeLocalSuperadminLogin: BeforeOperationHook = (hookArgs) => {
  if (hookArgs.operation !== 'login' || !env.SUPERADMIN_USERNAME || !env.SUPERADMIN_EMAIL) {
    return undefined;
  }

  const submittedAccount = hookArgs.args.data.email;
  if (typeof submittedAccount !== 'string') {
    return undefined;
  }

  if (submittedAccount.trim().toLowerCase() !== env.SUPERADMIN_USERNAME.trim().toLowerCase()) {
    return undefined;
  }

  hookArgs.args = {
    ...hookArgs.args,
    data: {
      ...hookArgs.args.data,
      email: env.SUPERADMIN_EMAIL,
    },
  };

  return undefined;
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
    singular: adminCollectionLabel('后台用户'),
    plural: adminCollectionLabel('后台用户'),
  },
  auth: {
    tokenExpiration: 60 * 60 * 24,
    maxLoginAttempts: 5,
    lockTime: 5 * 60 * 1000,
    useAPIKey: false,
    cookies: {
      secure: useSecureAuthCookies,
      sameSite: 'Lax',
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    },
  },
  admin: {
    useAsTitle: 'email',
    group: adminLabel('系统设置'),
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
      label: adminLabel('姓名'),
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: adminLabel('角色'),
      type: 'relationship',
      relationTo: 'roles',
      required: true,
      access: {
        create: isSuperAdminField,
        update: isSuperAdminField,
      },
      admin: {
        allowCreate: false,
        description: adminLabel('选择后台权限角色。'),
        hidden: true,
      },
    },
    {
      name: 'lastLoginAt',
      label: adminLabel('上次登录时间'),
      type: 'date',
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
        description: adminLabel('P2.S4/P4 登录 hook 自动维护。'),
      },
    },
    {
      name: 'twoFactorEnabled',
      label: adminLabel('启用二次验证'),
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
        position: 'sidebar',
        description: adminLabel('P4 启用二次验证时使用。'),
      },
    },
    {
      name: 'twoFactorSecret',
      label: adminLabel('二次验证密钥'),
      type: 'text',
      admin: {
        hidden: true,
        position: 'sidebar',
        description: adminLabel('P4 启用后需加密存储；不要在日志中输出。'),
      },
    },
    {
      name: 'deletedAt',
      label: adminLabel('删除标记时间'),
      type: 'date',
      admin: {
        hidden: true,
        position: 'sidebar',
        description: adminLabel('软删除标记；保留审计追溯。'),
      },
    },
  ],
};
