import type { Field } from 'payload';

import { adminLabel, type AdminBilingualText } from '../adminText';
import { generateSlug } from '../hooks/generateSlug';

type SlugFieldArgs = {
  label?: AdminBilingualText;
  required?: boolean;
  description?: AdminBilingualText;
  disableListColumn?: boolean;
  disableListFilter?: boolean;
};

export const slugField = ({
  label = adminLabel('访问链接后缀（Slug）'),
  required = true,
  description = adminLabel(
    '留空会自动生成。建议使用小写英文、数字和短横线，保存后不建议频繁修改。',
  ),
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
