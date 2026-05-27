import type { CollectionConfig, Field } from 'payload/types';

import DraftStatusCell from '../components/admin/cells/DraftStatusCell';
import { canCreate, canDelete, canUpdate, isAdminOrPublished } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import { newsCategoryOptions } from '../lib/payload/fields/options';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { generateSlug } from '../lib/payload/hooks/generateSlug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnPublish } from '../lib/payload/hooks/validateI18nComplete';

const contentLocales = ['zh', 'en', 'ru'] as const;

const requiredI18nPaths = [
  { path: 'title', label: '新闻标题' },
  { path: 'excerpt', label: '列表摘要' },
  { path: 'content', label: '新闻正文' },
] as const;

const draftStatusListCellField: Field = {
  name: 'statusBadge',
  label: '状态',
  type: 'ui',
  admin: {
    components: {
      Cell: DraftStatusCell,
      Field: () => null,
    },
  },
};

const draftStatusDataField = {
  name: '_status',
  type: 'select',
  admin: {
    disableListColumn: true,
  },
} as Field;

const hiddenSlugField: Field = {
  name: 'slug',
  type: 'text',
  label: '访问链接后缀（系统）',
  required: true,
  unique: true,
  index: true,
  admin: {
    hidden: true,
    disableListColumn: true,
    disableListFilter: true,
    description: '留空从标题生成；P2.S4 接入完整拼音与唯一性处理。',
  },
  hooks: {
    beforeValidate: [generateSlug],
  },
};

export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    singular: '新闻动态',
    plural: '新闻动态',
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'statusBadge', 'publishedAt'],
    components: {
      views: {
        Edit: {
          Default: {
            Tab: {
              condition: () => false,
            },
          },
        },
      },
    },
  },
  access: {
    read: isAdminOrPublished,
    create: canCreate('news'),
    update: canUpdate('news'),
    delete: canDelete('news'),
  },
  hooks: {
    beforeChange: [requireAllLocalesOnPublish(contentLocales, { paths: requiredI18nPaths })],
    afterChange: [auditAfterChange('news'), revalidateCollectionAfterChange('news')],
    afterDelete: [auditAfterDelete('news')],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
    maxPerDoc: 5,
  },
  fields: [
    i18nEditGuideField({ collectionSlug: 'news', requiredPaths: requiredI18nPaths }),
    draftStatusListCellField,
    draftStatusDataField,
    {
      type: 'tabs',
      tabs: [
        {
          label: '新闻信息',
          fields: [
            {
              name: 'title',
              label: '新闻标题',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'excerpt',
              label: '列表摘要',
              type: 'textarea',
              localized: true,
              admin: {
                description: '显示在新闻列表和详情页标题下方；留空时前台会从正文截取。',
              },
            },
            {
              name: 'author',
              label: '作者 / 来源',
              type: 'text',
              defaultValue: '永霏集团',
            },
            imageUploadField({
              name: 'cover',
              label: '封面图',
              required: true,
            }),
            {
              name: 'category',
              label: '新闻分类（系统）',
              type: 'select',
              required: true,
              defaultValue: 'news',
              options: newsCategoryOptions,
              index: true,
              admin: {
                hidden: true,
                disableListColumn: true,
                disableListFilter: true,
              },
            },
            {
              name: 'publishedAt',
              label: '发布时间',
              type: 'date',
              required: true,
              index: true,
              admin: {
                position: 'sidebar',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: '用于前台显示日期和新闻排序。',
              },
            },
            {
              name: 'isFeatured',
              label: '首页推荐',
              type: 'checkbox',
              defaultValue: false,
              index: true,
              admin: {
                position: 'sidebar',
                disableListColumn: true,
                description: '勾选后优先进入首页和新闻中心顶部推荐位。',
              },
            },
          ],
        },
        {
          label: '正文内容',
          fields: [
            {
              name: 'content',
              label: '新闻正文',
              type: 'richText',
              localized: true,
              required: true,
              admin: {
                description:
                  '新闻正文支持段落、标题、列表和媒体图片；插入图片后，前台详情页会以独立图片区块展示。',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'tags',
      label: '标签',
      type: 'array',
      localized: true,
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
      fields: [
        {
          name: 'value',
          label: '标签内容',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'relatedNews',
      label: '相关新闻',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
      maxRows: 4,
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    {
      name: 'relatedProducts',
      label: '关联产品',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      maxRows: 4,
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
      },
    },
    hiddenSlugField,
  ],
};
