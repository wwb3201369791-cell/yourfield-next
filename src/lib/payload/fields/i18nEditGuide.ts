import type { Field } from 'payload';

import type { RequiredI18nPath } from '../../i18n/i18nCompleteness';
import { adminLabel } from '../adminText';

type I18nEditGuideFieldArgs = Readonly<{
  collectionSlug?: string;
  globalSlug?: string;
  requiredPaths?: readonly RequiredI18nPath[];
}>;

export function i18nEditGuideField({
  collectionSlug,
  globalSlug,
  requiredPaths = [],
}: I18nEditGuideFieldArgs): Field {
  return {
    name: 'i18nEditGuide',
    label: adminLabel('三语编辑'),
    type: 'ui',
    custom: {
      ...(collectionSlug ? { collectionSlug } : {}),
      ...(globalSlug ? { globalSlug } : {}),
      requiredPaths,
    },
    admin: {
      components: {
        Field: '@/components/admin/I18nEditGuideLoader',
      },
      disableListColumn: true,
    },
  };
}
