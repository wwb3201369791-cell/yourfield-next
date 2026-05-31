import type { CollectionConfig, TextareaField } from 'payload';

import { canCreate, canDelete, canUpdate, isPublic } from '../lib/payload/access';
import { adminCollectionLabel, adminLabel } from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { productGroupOptions } from '../lib/payload/fields/options';
import { seoGroup } from '../lib/payload/fields/seo';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { slugField } from '../lib/payload/fields/slug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';

const localizedTextareaField = (name: string): TextareaField => ({
  name,
  type: 'textarea',
  localized: true,
});

const frontendOrderDescription = adminLabel('直接填 1、2、3；数字越小越靠前。');

export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: {
    singular: adminCollectionLabel('产品分类'),
    plural: adminCollectionLabel('产品分类'),
  },
  admin: {
    useAsTitle: 'name',
    group: adminLabel('产品管理'),
    hidden: true,
    defaultColumns: ['categoryId', 'name', 'group', 'order'],
    description: adminLabel('兼容旧数据的细分分类。日常维护优先使用“产品大类”和“产品”。'),
  },
  access: {
    read: isPublic,
    create: canCreate('product-categories'),
    update: canUpdate('product-categories'),
    delete: canDelete('product-categories'),
  },
  hooks: {
    afterChange: [
      auditAfterChange('product-categories'),
      revalidateCollectionAfterChange('product-categories'),
    ],
    afterDelete: [auditAfterDelete('product-categories')],
  },
  fields: [
    {
      name: 'categoryId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: adminLabel('旧站 category id，不可改名。'),
      },
    },
    slugField({
      description: adminLabel(
        '通常与 categoryId 一致；留空时 P2.S3 placeholder 从 categoryId 生成。',
      ),
    }),
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    localizedTextareaField('description'),
    {
      name: 'productGroup',
      type: 'relationship',
      relationTo: 'product-groups',
      index: true,
      admin: {
        description: adminLabel('前台产品中心使用的大类。新增分类请优先选择这里。'),
      },
    },
    {
      name: 'group',
      type: 'select',
      options: productGroupOptions,
      index: true,
      admin: {
        hidden: true,
        description: adminLabel('旧版固定大类字段，仅用于兼容历史数据。'),
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'product-categories',
    },
    imageUploadField({
      name: 'cover',
      label: adminLabel('封面图'),
    }),
    imageUploadField({
      name: 'icon',
      label: adminLabel('图标'),
    }),
    {
      name: 'order',
      type: 'number',
      label: adminLabel('前台展示位置'),
      defaultValue: 0,
      index: true,
      admin: {
        description: frontendOrderDescription,
      },
    },
    seoGroup,
  ],
};
