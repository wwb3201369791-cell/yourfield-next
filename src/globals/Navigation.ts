import type { GlobalConfig } from 'payload';

import { canUpdate, isPublic } from '../lib/payload/access';
import { adminLabel } from '../lib/payload/adminText';
import { auditGlobalAfterChange } from '../lib/payload/audit';
import { navItemFields } from '../lib/payload/fields/nav';
import { revalidateGlobalAfterChange } from '../lib/payload/hooks/revalidateContent';

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: adminLabel('导航配置'),
  admin: {
    group: adminLabel('系统设置'),
    hidden: true,
  },
  access: {
    read: isPublic,
    update: canUpdate('navigation'),
  },
  hooks: {
    afterChange: [auditGlobalAfterChange('navigation'), revalidateGlobalAfterChange('navigation')],
  },
  fields: [
    {
      name: 'mainNav',
      type: 'array',
      label: adminLabel('顶部导航'),
      fields: navItemFields,
    },
    {
      name: 'footerNav',
      type: 'array',
      label: adminLabel('页脚导航分组'),
      fields: [
        {
          name: 'heading',
          type: 'text',
          localized: true,
        },
        {
          name: 'items',
          type: 'array',
          fields: navItemFields,
        },
      ],
    },
    {
      name: 'mobileNav',
      type: 'array',
      label: adminLabel('移动端导航（留空则复用 mainNav）'),
      fields: navItemFields,
    },
  ],
};
