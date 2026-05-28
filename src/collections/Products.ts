import type { CollectionConfig, Field } from 'payload/types';

import DraftStatusCell from '../components/admin/cells/DraftStatusCell';
import ProductVisualEditorLoader from '../components/admin/product-editor/ProductVisualEditorLoader';
import {
  canCreate,
  canDelete,
  canUpdate,
  isAdminOrPublishedWithPublishedAt,
} from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { textArrayField, textareaArrayField, uploadArrayField } from '../lib/payload/fields/arrays';
import {
  certificationStatusOptions,
  qualityEvidenceTypeOptions,
  visualVariantOptions,
} from '../lib/payload/fields/options';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { slugField } from '../lib/payload/fields/slug';
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '../lib/payload/hooks/revalidateContent';

const featuresField: Field = {
  name: 'features',
  type: 'array',
  label: '产品特点（可选）',
  localized: true,
  admin: {
    description: '没有特点时可不添加。前台只展示已填写的特点。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
};

const specificationsField: Field = {
  name: 'specifications',
  type: 'array',
  label: '详情页参数表（可选）',
  admin: {
    description:
      '按旧版详情页参数表填写。可添加：型号、执行标准、颜色、尺码、材料、类别、结构等；没有的数据不要添加，前台会自动隐藏空项。',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      label: '参数名',
    },
    {
      name: 'value',
      type: 'text',
      localized: true,
      label: '参数值',
    },
    {
      name: 'group',
      type: 'text',
      admin: {
        description: '可选分组，如“尺寸”“性能”。',
      },
    },
    {
      name: 'order',
      type: 'number',
    },
  ],
};

const frontendOrderDescription = '直接填 1、2、3；数字越小越靠前；0 表示不优先。';

const certificationsField: Field = {
  name: 'certifications',
  type: 'array',
  admin: {
    description: 'P3+ 扩展字段：认证与证书。',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'issuer',
      type: 'text',
    },
    {
      name: 'certNumber',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      options: certificationStatusOptions,
      defaultValue: 'valid',
    },
    {
      name: 'validUntil',
      type: 'date',
    },
    {
      name: 'attachment',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};

const sizeGuideField: Field = {
  name: 'sizeGuide',
  type: 'group',
  label: '尺码对应表（可选）',
  admin: {
    description: '有尺码对应表时再填写；没有可留空，前台不会展示该区块。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'cornerLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'columns',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
        },
        {
          name: 'values',
          type: 'array',
          fields: [
            {
              name: 'value',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
};

const qualityEvidenceField: Field = {
  name: 'qualityEvidence',
  type: 'array',
  localized: true,
  admin: {
    description: 'P3+ 扩展字段：质量证据。',
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      options: qualityEvidenceTypeOptions,
    },
    {
      name: 'status',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'attachment',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};

const visualGroupsField: Field = {
  name: 'visualGroups',
  type: 'array',
  localized: true,
  label: '详情页图片分组（可选）',
  admin: {
    description:
      '用于详情页下方图片分组。建议按旧站整理为“场景图 / 建模图 / 模特上身图”；没有对应图片时不要添加。图片数量不限，前台用轮播和懒加载展示。',
  },
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: visualVariantOptions,
      defaultValue: 'gallery',
      label: '图片类型',
    },
    {
      name: 'title',
      type: 'text',
      label: '分组标题',
    },
    {
      name: 'description',
      type: 'textarea',
      label: '分组说明',
    },
    uploadArrayField({ name: 'images', label: '分组图片' }),
  ],
};

const scenariosField: Field = {
  name: 'scenarios',
  type: 'array',
  localized: true,
  label: '应用场景卡片（可选）',
  admin: {
    description:
      '用于产品详情页“适用场景”卡片，例如“灭火救援 / 应急抢险 / 灾害处置”。不填时前台可继续使用旧模板或适用场景文本。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '场景标题',
    },
    {
      name: 'description',
      type: 'textarea',
      label: '场景说明',
    },
  ],
};

const sellingPointsField: Field = {
  name: 'sellingPoints',
  type: 'array',
  localized: true,
  admin: {
    description: 'P3+ 扩展字段：营销卖点。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'text',
      type: 'textarea',
    },
    imageUploadField({
      name: 'icon',
      label: '图标',
    }),
  ],
};

const productFaqsField: Field = {
  name: 'productFaqs',
  type: 'array',
  localized: true,
  label: '常见问题（可选）',
  admin: {
    description: '直接填写该产品详情页展示的问题和答案；不需要先去关联 FAQ。',
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      label: '问题',
    },
    {
      name: 'answer',
      type: 'textarea',
      label: '答案',
    },
  ],
};

const legacyFaqRelationsField: Field = {
  name: 'faqs',
  type: 'relationship',
  relationTo: 'faqs',
  hasMany: true,
  label: '旧 FAQ 关联',
  admin: {
    hidden: true,
  },
};

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

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: '产品',
    plural: '产品',
  },
  admin: {
    useAsTitle: 'name',
    group: '产品管理',
    defaultColumns: ['model', 'name', 'productGroup', 'statusBadge', 'publishedAt'],
    description:
      '维护前台产品卡片和详情页内容。产品编号和名称用于识别与链接；图片、型号、介绍、参数、特点等都可留空，前台只展示已填写的数据。',
    components: {
      views: {
        Edit: {
          Default: {
            Component: ProductVisualEditorLoader,
          },
        },
      },
    },
    preview: (
      doc: Record<string, unknown>,
      { locale, token }: { locale: string; token?: string },
    ) => {
      const rawSlug = typeof doc.slug === 'string' && doc.slug ? doc.slug : doc.productId;
      const slug = typeof rawSlug === 'string' && rawSlug ? rawSlug : 'draft-product';
      const params = new URLSearchParams({ preview: '1' });

      if (token) {
        params.set('token', token);
      }

      return `/${locale || 'zh'}/products/${slug}?${params.toString()}`;
    },
  },
  access: {
    read: isAdminOrPublishedWithPublishedAt,
    create: canCreate('products'),
    update: canUpdate('products'),
    delete: canDelete('products'),
  },
  hooks: {
    afterChange: [auditAfterChange('products'), revalidateCollectionAfterChange('products')],
    afterDelete: [auditAfterDelete('products'), revalidateCollectionAfterDelete('products')],
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
    draftStatusListCellField,
    draftStatusDataField,
    {
      type: 'tabs',
      tabs: [
        {
          label: '基本信息',
          fields: [
            {
              name: 'productId',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              label: '产品编号',
              admin: {
                disableListColumn: true,
                description: '稳定编号，用于前台详情页链接。创建后不建议修改。',
              },
            },
            {
              name: 'sku',
              type: 'text',
              index: true,
              label: 'SKU / 内部编码',
            },
            {
              name: 'model',
              type: 'text',
              index: true,
              label: '型号 / 规格',
              admin: {
                description: '可选。展示在前台详情页主图右侧和规格参数区。',
              },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: '产品名称',
            },
            slugField({ description: '默认从 productId 生成；P2.S4 接入完整拼音与唯一性处理。' }),
            {
              name: 'productGroup',
              type: 'relationship',
              relationTo: 'product-groups',
              index: true,
              required: true,
              label: '所属产品大类',
              admin: {
                description:
                  '必填。创建产品时先选择产品大类，前台产品中心会直接把该产品放到这个大类下面。',
              },
            },
          ],
        },
        {
          label: '主图与简介',
          fields: [
            uploadArrayField({
              name: 'images',
              label: '产品主图（可选）',
              maxRows: 1,
            }),
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: '产品介绍（可选）',
              admin: {
                description: '展示在主图右侧摘要，也会作为“商品介绍”区块的概述内容。',
              },
            },
            textArrayField({ name: 'standards', label: '执行标准（可选）' }),
            textArrayField({ name: 'sizeRange', label: '尺码范围（可选）' }),
            textArrayField({ name: 'materials', label: '材料（可选）', localized: true }),
            featuresField,
          ],
        },
        {
          label: '核心卖点',
          fields: [sellingPointsField],
        },
        {
          label: '规格参数',
          fields: [specificationsField],
        },
        {
          label: '尺码对应表',
          fields: [sizeGuideField],
        },
        {
          label: '应用场景',
          fields: [
            textareaArrayField({
              name: 'applications',
              label: '适用场景文本（可选）',
              localized: true,
            }),
            scenariosField,
          ],
        },
        {
          label: '详情页图组',
          fields: [visualGroupsField],
        },
        {
          label: '资料与认证状态',
          fields: [certificationsField, qualityEvidenceField],
        },
        {
          label: '洗护与维护',
          fields: [textareaArrayField({ name: 'careInstructions', localized: true })],
        },
        {
          label: '常见问题',
          fields: [productFaqsField, legacyFaqRelationsField],
        },
        {
          label: '媒体',
          fields: [
            {
              name: 'video',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'displayOrder',
              type: 'number',
              label: '前台展示位置',
              defaultValue: 0,
              index: true,
              admin: {
                description: frontendOrderDescription,
                position: 'sidebar',
              },
            },
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
        },
      ],
    },
  ],
};
