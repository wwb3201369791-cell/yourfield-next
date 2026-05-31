import type { CollectionConfig, Field, TextareaField } from 'payload';

import { canCreate, canDelete, canUpdate, isPublic } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import { createSeoGroup } from '../lib/payload/fields/seo';
import { generateSlug } from '../lib/payload/hooks/generateSlug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnPublish } from '../lib/payload/hooks/validateI18nComplete';

const contentLocales = ['zh', 'en', 'ru'] as const;

const requiredI18nPaths = [
  { path: 'name', label: '前台显示名称' },
  { path: 'description', label: '大类说明' },
] as const;

const localizedTextareaField = (name: string): TextareaField => ({
  name,
  type: 'textarea',
  localized: true,
});

const frontendOrderDescription = {
  en: 'Use 1, 2, 3… Lower numbers appear first on the storefront.',
  zh: '直接填 1、2、3；数字越小越靠前。',
};

const productGroupSeoGroup = {
  ...createSeoGroup({ label: 'SEO 设置（系统）' }),
  admin: {
    hidden: true,
    disableListColumn: true,
    disableListFilter: true,
  },
} as Field;

export const ProductGroups: CollectionConfig = {
  slug: 'product-groups',
  labels: {
    singular: { en: 'Product group', zh: '产品大类' },
    plural: { en: 'Product groups', zh: '产品大类' },
  },
  defaultSort: 'order',
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    group: { en: 'Product management', zh: '产品管理' },
    defaultColumns: ['name', 'showOnFrontendBadge', 'order'],
    listSearchableFields: ['name', 'groupId'],
    description: {
      en: 'Create and maintain one horizontal storefront product category. After saving, assign products to this group so the storefront product center displays the category and its products.',
      zh: '这里创建的是前台产品中心的一条横向产品栏目。保存后，再把产品归到这个大类下，前台就会显示这个大类和里面的产品。',
    },
    components: {
      views: {
        edit: {
          Default: {
            tab: {
              condition: () => false,
            },
          },
        },
      },
    },
  },
  access: {
    read: isPublic,
    create: canCreate('product-groups'),
    update: canUpdate('product-groups'),
    delete: canDelete('product-groups'),
  },
  hooks: {
    beforeChange: [
      requireAllLocalesOnPublish(contentLocales, {
        paths: requiredI18nPaths,
        status: { mode: 'booleanStatus', field: 'showOnFrontend' },
      }),
    ],
    afterChange: [
      auditAfterChange('product-groups'),
      revalidateCollectionAfterChange('product-groups'),
    ],
    afterDelete: [auditAfterDelete('product-groups')],
  },
  fields: [
    i18nEditGuideField({ collectionSlug: 'product-groups', requiredPaths: requiredI18nPaths }),
    {
      name: 'showOnFrontendBadge',
      label: { en: 'Visibility', zh: '显示状态' },
      type: 'ui',
      admin: {
        components: {
          Cell: '@/components/admin/cells/VisibilityStatusCell',
          Field: false,
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: '基本信息',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: '前台显示名称',
              admin: {
                description: '用户在产品中心看到的大类标题，例如“洁净化学与医疗防护”。',
                disableListFilter: true,
              },
            },
            {
              ...localizedTextareaField('description'),
              label: '大类说明（可选）',
              admin: {
                description:
                  '显示在产品中心大类标题旁边的摘要位置。不填时，前台会优先用该大类下的子分类或产品名称补充。',
                disableListColumn: true,
                disableListFilter: true,
              },
            },
          ],
        },
        {
          label: '前台展示',
          fields: [
            {
              name: 'showOnFrontend',
              type: 'checkbox',
              label: '在前台产品中心显示',
              defaultValue: true,
              index: true,
              admin: {
                disableListFilter: true,
                disableListColumn: true,
              },
            },
            {
              name: 'order',
              type: 'number',
              label: '前台展示位置',
              defaultValue: 1,
              index: true,
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
      ],
    },
    {
      name: 'groupId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: '大类英文标识（系统）',
      admin: {
        hidden: true,
        description: '给系统识别用，会用于链接、筛选和产品归类。创建后不要随意修改。',
        disableListFilter: true,
        disableListColumn: true,
      },
      hooks: {
        beforeValidate: [generateSlug],
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: '访问链接后缀（系统）',
      required: true,
      unique: true,
      index: true,
      admin: {
        hidden: true,
        position: 'sidebar',
        description:
          '会出现在网址里，建议和“大类英文标识”保持一致。一般留空自动生成即可，保存后不建议频繁修改。',
        disableListColumn: true,
        disableListFilter: true,
      },
      hooks: {
        beforeValidate: [generateSlug],
      },
    },
    productGroupSeoGroup,
  ],
};
