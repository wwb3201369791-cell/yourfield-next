import type { CollectionConfig, Field, TextareaField } from 'payload';

import { canCreate, canDelete, canUpdate, isAdminOrPublished } from '../lib/payload/access';
import {
  adminCollectionLabel,
  adminLabel,
  adminListLabel,
  adminNavLabel,
} from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { adminRowActionsField } from '../lib/payload/fields/adminRowActions';
import { textArrayField } from '../lib/payload/fields/arrays';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { autoSetPublishedAtOnPublish } from '../lib/payload/hooks/autoPublishedAt';
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

const frontendOrderDescription = adminLabel(
  '控制解决方案页面、顶部下拉菜单与页脚导航的展示顺序；直接填 1、2、3，数字越小越靠前。',
);

const draftStatusListCellField: Field = {
  name: 'statusBadge',
  label: adminLabel('状态'),
  type: 'ui',
  admin: {
    components: {
      Cell: '@/components/admin/cells/DraftStatusCell',
      Field: false,
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
    singular: adminCollectionLabel('解决方案'),
    plural: adminCollectionLabel('解决方案'),
  },
  defaultSort: 'order',
  admin: {
    group: adminNavLabel('内容管理'),
    hideAPIURL: true,
    useAsTitle: 'solutionId',
    listSearchableFields: ['title'],
    defaultColumns: ['title', 'statusBadge', 'order', 'publishedAt', 'rowActions'],
    description: {
      en: 'Maintain the Solutions page, header dropdown, and footer navigation. Created, removed, or reordered published items are synced to the storefront.',
      zh: '这里维护前台解决方案页面、顶部下拉菜单与页脚导航。新增、删除或调整前台位置后，前台会按发布内容同步展示。',
    },
    components: {
      views: {
        edit: {
          default: {
            tab: {
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
    beforeChange: [
      requireAllLocalesOnPublish(contentLocales, { paths: requiredI18nPaths }),
      autoSetPublishedAtOnPublish(),
    ],
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
    adminRowActionsField,
    {
      type: 'tabs',
      tabs: [
        {
          label: adminLabel('前台展示'),
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
              label: adminListLabel('方案标题'),
              admin: {
                description: adminLabel('前台卡片标题，例如“电力与能源”“应急救援”。'),
              },
            },
            {
              ...localizedTextareaField('summary'),
              label: adminLabel('卡片说明'),
              admin: {
                description: adminLabel('前台卡片展示的一段说明，建议 40-90 个中文字符。'),
              },
            },
            imageUploadField({
              name: 'cover',
              label: adminLabel('方案主图'),
              admin: {
                description: adminLabel('前台解决方案卡片使用的主图。'),
              },
            }),
            {
              name: 'order',
              type: 'number',
              defaultValue: 1,
              index: true,
              label: adminListLabel('前台位置'),
              admin: {
                description: frontendOrderDescription,
                disableListFilter: true,
                components: {
                  Cell: '@/components/admin/cells/SolutionPositionCell',
                },
              },
            },
          ],
        },
        {
          label: adminLabel('内容要点'),
          fields: [
            textArrayField({
              name: 'features',
              localized: true,
              label: adminLabel('方案要点'),
              maxRows: 6,
            }),
            textArrayField({
              name: 'productTags',
              localized: true,
              label: adminLabel('核心产品标签'),
              maxRows: 8,
            }),
            {
              name: 'content',
              type: 'richText',
              localized: true,
              label: adminLabel('详细说明（可选）'),
              admin: {
                description: adminLabel('一般可留空；需要补充长文说明时再填写。'),
              },
            },
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: adminListLabel('发布时间'),
      admin: {
        condition: () => false,
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: adminLabel('系统在点击发布时自动写入，用于后台列表和前台同步判断。'),
        position: 'sidebar',
      },
    },
    {
      name: 'solutionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: adminLabel('系统标识（隐藏）'),
      admin: {
        hidden: true,
        description: adminLabel(
          '用于前台锚点和导入更新的稳定标识，例如 power-energy。通常不要修改。',
        ),
        disableListFilter: true,
        components: {
          Cell: '@/components/admin/cells/SolutionTitleCell',
        },
      },
      hooks: {
        beforeValidate: [generateSlug],
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: adminLabel('访问链接后缀（隐藏）'),
      required: true,
      unique: true,
      index: true,
      admin: {
        hidden: true,
        position: 'sidebar',
        description: adminLabel('前台访问链接后缀；留空时从系统标识生成，通常不要手动修改。'),
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
      label: adminLabel('关联产品大类'),
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        description: adminLabel(
          '内部预留字段。当前前台“查看产品”统一进入产品页，不在列表展示关联关系。',
        ),
      },
    },
    {
      name: 'relatedCategories',
      type: 'relationship',
      relationTo: 'product-categories',
      hasMany: true,
      maxRows: 12,
      label: adminLabel('旧产品分类（内部兼容）'),
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        description: adminLabel('旧站遗留字段，新方案优先维护“关联产品大类”和“关联产品”。'),
      },
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      maxRows: 12,
      label: adminLabel('关联产品'),
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        description: adminLabel('内部预留字段。当前前台“查看产品”统一进入产品页。'),
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: adminLabel('状态'),
      admin: {
        hidden: true,
        disableListColumn: true,
        disableListFilter: true,
        components: {
          Cell: '@/components/admin/cells/DraftStatusCell',
        },
        description: adminLabel(
          '内部兼容字段。当前前台解决方案集合里的发布内容都会作为上方大图方案展示。',
        ),
      },
    },
  ],
};
