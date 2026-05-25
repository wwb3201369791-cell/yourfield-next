import type { CollectionConfig } from 'payload/types';

import { pageBlocks } from '../blocks';
import { canCreate, canDelete, canUpdate, isAdminOrPublished } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { heroVariantOptions, pageKeyOptions } from '../lib/payload/fields/options';
import { seoGroup } from '../lib/payload/fields/seo';
import { slugField } from '../lib/payload/fields/slug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: '页面',
    plural: '页面',
  },
  admin: {
    useAsTitle: 'title',
    group: '内容管理',
    defaultColumns: ['pageKey', 'title', 'slug', '_status', 'publishedAt'],
    hidden: true,
  },
  access: {
    read: isAdminOrPublished,
    create: canCreate('pages'),
    update: canUpdate('pages'),
    delete: canDelete('pages'),
  },
  hooks: {
    afterChange: [auditAfterChange('pages'), revalidateCollectionAfterChange('pages')],
    afterDelete: [auditAfterDelete('pages')],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
    maxPerDoc: 10,
  },
  fields: [
    {
      name: 'pageKey',
      type: 'select',
      required: true,
      unique: true,
      index: true,
      options: pageKeyOptions,
      admin: {
        position: 'sidebar',
        description: '固定页面标识，创建后不要修改。',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField({ required: false, description: '固定页面路由 slug；home 可填空字符串。' }),
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'variant',
          type: 'select',
          options: heroVariantOptions,
          defaultValue: 'image-bg',
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'subtitle',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'backgroundImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'backgroundVideo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'ctaLabel',
          type: 'text',
          localized: true,
        },
        {
          name: 'ctaHref',
          type: 'text',
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: pageBlocks,
    },
    seoGroup,
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
};
