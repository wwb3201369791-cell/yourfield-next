import type { CollectionConfig, Field, TextareaField } from 'payload/types';

import DraftStatusCell from '../components/admin/cells/DraftStatusCell';
import SolutionPositionCell from '../components/admin/cells/SolutionPositionCell';
import SolutionTitleCell from '../components/admin/cells/SolutionTitleCell';
import { canCreate, canDelete, canUpdate, isAdminOrPublished } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { textArrayField } from '../lib/payload/fields/arrays';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { generateSlug } from '../lib/payload/hooks/generateSlug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnPublish } from '../lib/payload/hooks/validateI18nComplete';

const contentLocales = ['zh', 'en', 'ru'] as const;

const requiredI18nPaths = [
  { path: 'title', label: '方案标题' },
  { path: 'summary', label: '卡片说明' },
  { path: 'features', label: '方案要点' },
  { path: 'features.value', label: '方案要点' },
  { path: 'productTags', label: '核心产品标签' },
  { path: 'productTags.value', label: '核心产品标签' },
  { path: 'content', label: '详细说明' },
] as const;

const localizedTextareaField = (name: string): TextareaField => ({
  name,
  type: 'textarea',
  localized: true,
});

const frontendOrderDescription = '直接填 1、2、3；数字越小越靠前。';

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

export const Solutions: CollectionConfig = {
  slug: 'solutions',
  labels: {
    singular: '解决方案',
    plural: '解决方案',
  },
  defaultSort: 'order',
  admin: {
    hideAPIURL: true,
    useAsTitle: 'title',
    listSearchableFields: ['title'],
    defaultColumns: ['title', 'statusBadge', 'order', 'publishedAt'],
    description: '这里维护前台展示的 4 个解决方案卡片，编辑标题、说明、主图和展示顺序即可。',
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
    create: canCreate('solutions'),
    update: canUpdate('solutions'),
    delete: canDelete('solutions'),
  },
  hooks: {
    beforeChange: [requireAllLocalesOnPublish(contentLocales, { paths: requiredI18nPaths })],
    afterChange: [auditAfterChange('solutions'), revalidateCollectionAfterChange('solutions')],
    afterDelete: [auditAfterDelete('solutions')],
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
    i18nEditGuideField({ collectionSlug: 'solutions', requiredPaths: requiredI18nPaths }),
    draftStatusListCellField,
    draftStatusDataField,
    {
      type: 'tabs',
      tabs: [
        {
          label: '前台展示',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: '方案标题',
              admin: {
                description: '前台卡片标题，例如“电力与能源”“应急救援”。',
              },
            },
            {
              ...localizedTextareaField('summary'),
              label: '卡片说明',
              admin: {
                description: '前台卡片展示的一段说明，建议 40-90 个中文字符。',
              },
            },
            imageUploadField({
              name: 'cover',
              label: '方案主图',
              admin: {
                description: '前台解决方案卡片使用的主图。',
              },
            }),
            {
              name: 'order',
              type: 'number',
              defaultValue: 1,
              index: true,
              label: '前台位置',
              admin: {
                description: frontendOrderDescription,
                disableListFilter: true,
                components: {
                  Cell: SolutionPositionCell,
                },
              },
            },
          ],
        },
        {
          label: '内容要点',
          fields: [
            textArrayField({
              name: 'features',
              localized: true,
              label: '方案要点',
              maxRows: 6,
            }),
            textArrayField({
              name: 'productTags',
              localized: true,
              label: '核心产品标签',
              maxRows: 8,
            }),
            {
              name: 'content',
              type: 'richText',
              localized: true,
              label: '详细说明（可选）',
              admin: {
                description: '一般可留空；需要补充长文说明时再填写。',
              },
            },
          ],
        },
        {
          label: '发布设置',
          fields: [
            {
              name: 'publishedAt',
              type: 'date',
              label: '发布时间',
              admin: {
                position: 'sidebar',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'solutionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: '系统标识（隐藏）',
      admin: {
        hidden: true,
        description: '用于前台锚点和导入更新的稳定标识，例如 power-energy。通常不要修改。',
        disableListFilter: true,
        components: {
          Cell: SolutionTitleCell,
        },
      },
      hooks: {
        beforeValidate: [generateSlug],
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: '访问链接后缀（隐藏）',
      required: true,
      unique: true,
      index: true,
      admin: {
        hidden: true,
        position: 'sidebar',
        description: '前台访问链接后缀；留空时从系统标识生成，通常不要手动修改。',
        disableListColumn: true,
        disableListFilter: true,
      },
      hooks: {
        beforeValidate: [generateSlug],
      },
    },
    {
      name: 'relatedProductGroups',
      type: 'relationship',
      relationTo: 'product-groups',
      hasMany: true,
      maxRows: 5,
      label: '关联产品大类',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        description: '内部预留字段。当前前台“查看产品”统一进入产品页，不在列表展示关联关系。',
      },
    },
    {
      name: 'relatedCategories',
      type: 'relationship',
      relationTo: 'product-categories',
      hasMany: true,
      maxRows: 12,
      label: '旧产品分类（内部兼容）',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        description: '旧站遗留字段，新方案优先维护“关联产品大类”和“关联产品”。',
      },
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      maxRows: 12,
      label: '关联产品',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        description: '内部预留字段。当前前台“查看产品”统一进入产品页。',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: '状态',
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        components: {
          Cell: DraftStatusCell,
        },
        description: '内部兼容字段。当前前台解决方案集合里的发布内容都会作为上方大图方案展示。',
      },
    },
  ],
};
