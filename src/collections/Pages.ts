import type { CollectionConfig } from 'payload';

import { pageBlocks } from '../blocks';
import { canCreate, canDelete, canUpdate, isAdminOrPublished } from '../lib/payload/access';
import { adminCollectionLabel, adminLabel } from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import { heroVariantOptions, pageKeyOptions } from '../lib/payload/fields/options';
import { seoGroup } from '../lib/payload/fields/seo';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { slugField } from '../lib/payload/fields/slug';
import { autoSetPublishedAtOnPublish } from '../lib/payload/hooks/autoPublishedAt';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnPublish } from '../lib/payload/hooks/validateI18nComplete';

const contentLocales = ['zh', 'en', 'ru'] as const;
const requiredI18nPaths = [{ path: 'title', label: '页面标题' }] as const;

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: adminCollectionLabel('页面'),
    plural: adminCollectionLabel('页面'),
  },
  admin: {
    useAsTitle: 'title',
    group: adminLabel('内容管理'),
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
    beforeChange: [
      requireAllLocalesOnPublish(contentLocales, { paths: requiredI18nPaths }),
      autoSetPublishedAtOnPublish(),
    ],
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
    i18nEditGuideField({ collectionSlug: 'pages', requiredPaths: requiredI18nPaths }),
    {
      name: 'pageKey',
      type: 'select',
      required: true,
      unique: true,
      index: true,
      options: pageKeyOptions,
      admin: {
        position: 'sidebar',
        description: adminLabel('固定页面标识，创建后不要修改。'),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField({
      required: false,
      description: adminLabel('固定页面路由 slug；home 可填空字符串。'),
    }),
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
        imageUploadField({
          name: 'backgroundImage',
          label: adminLabel('背景图片'),
        }),
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
        condition: () => false,
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
};
