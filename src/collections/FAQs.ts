import type { CollectionConfig } from 'payload';

import { canCreate, canDelete, canUpdate, isAdminOrFaqPublished } from '../lib/payload/access';
import { adminLabel } from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { textArrayField } from '../lib/payload/fields/arrays';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import { faqScopeOptions } from '../lib/payload/fields/options';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnPublish } from '../lib/payload/hooks/validateI18nComplete';

const contentLocales = ['zh', 'en', 'ru'] as const;

const requiredI18nPaths = [
  { path: 'question', label: '问题' },
  { path: 'answer', label: '答案' },
] as const;

const frontendOrderDescription = adminLabel('直接填 1、2、3；数字越小越靠前。');

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: adminLabel('常见问题'),
    plural: adminLabel('常见问题'),
  },
  admin: {
    useAsTitle: 'question',
    group: adminLabel('内容管理'),
    defaultColumns: ['question', 'scope', 'isPublished', 'order'],
    hidden: true,
  },
  access: {
    read: isAdminOrFaqPublished,
    create: canCreate('faqs'),
    update: canUpdate('faqs'),
    delete: canDelete('faqs'),
  },
  hooks: {
    beforeChange: [
      requireAllLocalesOnPublish(contentLocales, {
        paths: requiredI18nPaths,
        status: { mode: 'booleanStatus', field: 'isPublished' },
      }),
    ],
    afterChange: [auditAfterChange('faqs'), revalidateCollectionAfterChange('faqs')],
    afterDelete: [auditAfterDelete('faqs')],
  },
  fields: [
    i18nEditGuideField({ collectionSlug: 'faqs', requiredPaths: requiredI18nPaths }),
    {
      name: 'question',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'scope',
      type: 'select',
      required: true,
      options: faqScopeOptions,
      index: true,
      defaultValue: 'global',
    },
    {
      name: 'pageRef',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        condition: (data) => data.scope === 'page',
      },
    },
    {
      name: 'productRef',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        condition: (data) => data.scope === 'product',
      },
    },
    {
      name: 'newsRef',
      type: 'relationship',
      relationTo: 'news',
      admin: {
        condition: (data) => data.scope === 'news',
      },
    },
    textArrayField({ name: 'tags' }),
    {
      name: 'order',
      type: 'number',
      label: adminLabel('展示位置'),
      defaultValue: 0,
      index: true,
      admin: {
        description: frontendOrderDescription,
      },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      index: true,
    },
  ],
};
