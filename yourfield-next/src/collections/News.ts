import type { CollectionConfig, Field } from 'payload/types';

import DraftStatusCell from '../components/admin/cells/DraftStatusCell';
import { canCreate, canDelete, canUpdate, isAdminOrPublished } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { newsCategoryOptions } from '../lib/payload/fields/options';
import { createSeoGroup } from '../lib/payload/fields/seo';
import { generateSlug } from '../lib/payload/hooks/generateSlug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';

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

const hiddenSeoGroup = {
  ...createSeoGroup({ label: 'SEO / 系统（隐藏）' }),
  admin: {
    hidden: true,
    disableListColumn: true,
    disableListFilter: true,
  },
} as Field;

export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    singular: '新闻动态',
    plural: '新闻动态',
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'statusBadge', 'publishedAt'],
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
            {
              name: 'cover',
              label: '封面图',
              type: 'upload',
              relationTo: 'media',
              required: true,
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
        {
          label: '发布设置',
          fields: [
            {
              name: 'category',
              label: '新闻分类',
              type: 'select',
              required: true,
              options: newsCategoryOptions,
              index: true,
            },
            {
              name: 'tags',
              label: '标签',
              type: 'array',
              localized: true,
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
                description: '允许未来时间；真实定时发布任务在 P3 实现。',
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
                description: '用于标记重点新闻；当前前台默认优先展示最新发布内容。',
              },
            },
            {
              name: 'relatedNews',
              label: '相关新闻',
              type: 'relationship',
              relationTo: 'news',
              hasMany: true,
              maxRows: 4,
            },
            {
              name: 'relatedProducts',
              label: '关联产品',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              maxRows: 4,
            },
          ],
        },
      ],
    },
    hiddenSlugField,
    hiddenSeoGroup,
  ],
};
