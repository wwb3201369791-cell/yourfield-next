import type { Field } from 'payload/types';

import I18nEditGuideLoader from '@/components/admin/I18nEditGuideLoader';

import type { RequiredI18nPath } from '../../i18n/i18nCompleteness';

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
    label: '三语编辑',
    type: 'ui',
    custom: {
      ...(collectionSlug ? { collectionSlug } : {}),
      ...(globalSlug ? { globalSlug } : {}),
      requiredPaths,
    },
    admin: {
      components: {
        Field: I18nEditGuideLoader,
      },
      disableListColumn: true,
    },
  };
}
