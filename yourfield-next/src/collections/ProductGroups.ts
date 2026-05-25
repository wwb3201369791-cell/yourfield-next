import type { CollectionConfig, Field, TextareaField } from 'payload/types';

import DisplayPositionCell from '../components/admin/cells/SolutionPositionCell';
import { canCreate, canDelete, canUpdate, isPublic } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { createSeoGroup } from '../lib/payload/fields/seo';
import { generateSlug } from '../lib/payload/hooks/generateSlug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';

const localizedTextareaField = (name: string): TextareaField => ({
  name,
  type: 'textarea',
  localized: true,
});

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
    singular: '产品大类',
    plural: '产品大类',
  },
  defaultSort: 'order',
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    group: '产品管理',
    defaultColumns: ['name', 'order'],
    listSearchableFields: ['name', 'groupId'],
    description:
      '这里创建的是前台产品中心的一条横向产品栏目。保存后，再把产品归到这个大类下，前台就会显示这个大类和里面的产品。',
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
    read: isPublic,
    create: canCreate('product-groups'),
    update: canUpdate('product-groups'),
    delete: canDelete('product-groups'),
  },
  hooks: {
    afterChange: [
      auditAfterChange('product-groups'),
      revalidateCollectionAfterChange('product-groups'),
    ],
    afterDelete: [auditAfterDelete('product-groups')],
  },
  fields: [
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
                description:
                  '开启后，并且这个大类下面有已发布产品，前台产品中心会出现对应的一整条栏目。关闭后只保留后台数据。',
                disableListFilter: true,
                disableListColumn: true,
              },
            },
            {
              name: 'order',
              type: 'number',
              label: '前台展示位置',
              defaultValue: 0,
              index: true,
              admin: {
                description:
                  '数字越小越靠前。当前 10 / 20 / 30 / 40 / 50 分别对应第 1 / 2 / 3 / 4 / 5 位。',
                disableListFilter: true,
                components: {
                  Cell: DisplayPositionCell,
                },
              },
            },
            {
              name: 'cover',
              type: 'upload',
              label: '大类封面图（可选）',
              relationTo: 'media',
              admin: {
                description:
                  '预留给大类封面或后续独立大类页使用。目前产品中心主要展示具体产品图片，不上传也可以。',
                disableListColumn: true,
                disableListFilter: true,
              },
            },
            {
              name: 'icon',
              type: 'upload',
              label: '大类图标（可选）',
              relationTo: 'media',
              admin: {
                description: '预留给导航、入口卡片或图标化展示使用。目前前台不强制依赖。',
                disableListColumn: true,
                disableListFilter: true,
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
