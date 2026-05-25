import type { CollectionConfig } from 'payload/types';

import { canCreate, canDelete, canUpdate, isAdminOrFaqPublished } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { textArrayField } from '../lib/payload/fields/arrays';
import { faqScopeOptions } from '../lib/payload/fields/options';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: '常见问题',
    plural: '常见问题',
  },
  admin: {
    useAsTitle: 'question',
    group: '内容管理',
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
    afterChange: [auditAfterChange('faqs'), revalidateCollectionAfterChange('faqs')],
    afterDelete: [auditAfterDelete('faqs')],
  },
  fields: [
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
      defaultValue: 0,
      index: true,
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
