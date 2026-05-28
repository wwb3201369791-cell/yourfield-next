import type { Field } from 'payload/types';

import { generateSlug } from '../hooks/generateSlug';

type SlugFieldArgs = {
  label?: string;
  required?: boolean;
  description?: string;
  disableListColumn?: boolean;
  disableListFilter?: boolean;
};

export const slugField = ({
  label = '访问链接后缀（Slug）',
  required = true,
  description = '留空会自动生成。建议使用小写英文、数字和短横线，保存后不建议频繁修改。',
  disableListColumn = false,
  disableListFilter = false,
}: SlugFieldArgs = {}): Field => ({
  name: 'slug',
  type: 'text',
  label,
  required,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description,
    disableListColumn,
    disableListFilter,
  },
  hooks: {
    beforeValidate: [generateSlug],
  },
});
