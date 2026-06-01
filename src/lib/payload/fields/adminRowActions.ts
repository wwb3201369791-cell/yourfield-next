import type { Field } from 'payload';

import { adminLabel } from '../adminText';

export const adminRowActionsField: Field = {
  name: 'rowActions',
  label: adminLabel('操作'),
  type: 'ui',
  admin: {
    components: {
      Cell: '@/components/admin/cells/AdminListRowActionsCell',
      Field: false,
    },
  },
};
