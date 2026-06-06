import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload';

import {
  canCreate,
  canDelete,
  canUpdate,
  isAdminOrPublishedWithPublishedAt,
} from '../lib/payload/access';
import {
  adminCollectionLabel,
  adminLabel,
  adminListLabel,
  adminNavLabel,
} from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { adminRowActionsField } from '../lib/payload/fields/adminRowActions';
import { textArrayField, textareaArrayField, uploadArrayField } from '../lib/payload/fields/arrays';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import {
  certificationStatusOptions,
  qualityEvidenceTypeOptions,
  visualVariantOptions,
} from '../lib/payload/fields/options';
import { createSeoGroup } from '../lib/payload/fields/seo';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { slugField } from '../lib/payload/fields/slug';
import { autoSetPublishedAtOnPublish } from '../lib/payload/hooks/autoPublishedAt';
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnPublish } from '../lib/payload/hooks/validateI18nComplete';
import {
  productContentLocales,
  requiredProductPublishI18nPaths,
  requiredProductI18nPaths,
} from '../lib/product/productI18nRequirements';

const featuresField: Field = {
  name: 'features',
  type: 'array',
  label: adminLabel('产品特点（可选）'),
  localized: true,
  admin: {
    description: adminLabel('没有特点时可不添加。前台只展示已填写的特点。'),
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
  label: adminLabel('详情页参数表（可选）'),
  admin: {
    description: adminLabel(
      '按旧版详情页参数表填写。可添加：型号、执行标准、颜色、尺码、材料、类别、结构等；没有的数据不要添加，前台会自动隐藏空项。',
    ),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      label: adminLabel('参数名'),
    },
    {
      name: 'value',
      type: 'text',
      localized: true,
      label: adminLabel('参数值'),
    },
    {
      name: 'group',
      type: 'text',
      admin: {
        description: adminLabel('可选分组，如“尺寸”“性能”。'),
      },
    },
    {
      name: 'order',
      type: 'number',
    },
  ],
};

const frontendOrderDescription = adminLabel(
  '直接填 1、2、3；数字越小越靠前；发布前必须填写，0 仅用于草稿暂存。',
);

function hasProductMainImage(images: unknown) {
  return Array.isArray(images)
    ? images.some((image) => {
        if (!image || typeof image !== 'object') {
          return false;
        }

        return Boolean((image as { file?: unknown }).file);
      })
    : false;
}

function hasPositiveDisplayOrder(value: unknown) {
  const numberValue = typeof value === 'string' ? Number(value) : value;

  return typeof numberValue === 'number' && Number.isFinite(numberValue) && numberValue > 0;
}

const requireProductMainImageOnPublish: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const incoming = data as Record<string, unknown>;
  const previous = originalDoc as Record<string, unknown> | undefined;
  const nextStatus = incoming._status ?? previous?._status;

  if (nextStatus !== 'published') {
    return incoming;
  }

  const nextImages = Object.prototype.hasOwnProperty.call(incoming, 'images')
    ? incoming.images
    : previous?.images;

  if (!hasProductMainImage(nextImages)) {
    throw new Error('产品发布前必须上传产品主图。没有真实主图的产品不会在前台展示。');
  }

  const nextDisplayOrder = Object.prototype.hasOwnProperty.call(incoming, 'displayOrder')
    ? incoming.displayOrder
    : previous?.displayOrder;

  if (!hasPositiveDisplayOrder(nextDisplayOrder)) {
    throw new Error(
      '产品发布前必须填写大类内展示序号（1、2、3）。这样首页每个大类的首个产品不会漂移。',
    );
  }

  return incoming;
};

const certificationsField: Field = {
  name: 'certifications',
  type: 'array',
  admin: {
    description: adminLabel('P3+ 扩展字段：认证与证书。'),
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
  label: adminLabel('尺码对应表（可选）'),
  admin: {
    description: adminLabel('有尺码对应表时再填写；没有可留空，前台不会展示该区块。'),
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
    description: adminLabel('P3+ 扩展字段：质量证据。'),
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
  label: adminLabel('详情页图片分组（可选）'),
  admin: {
    description: adminLabel(
      '用于详情页下方图片分组。建议按旧站整理为“场景图 / 建模图 / 模特上身图”；没有对应图片时不要添加。图片数量不限，前台用轮播和懒加载展示。',
    ),
  },
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: visualVariantOptions,
      defaultValue: 'gallery',
      label: adminLabel('图片类型'),
    },
    {
      name: 'title',
      type: 'text',
      label: adminLabel('分组标题'),
    },
    {
      name: 'description',
      type: 'textarea',
      label: adminLabel('分组说明'),
    },
    uploadArrayField({
      name: 'images',
      label: adminLabel('分组图片'),
      uploadDescription: adminLabel(
        '详情页分组图片建议 JPG / PNG / WebP / GIF，推荐 1600 × 1200 px 或至少 1200 px 宽，单图建议不超过 10MB；前台会按版式等比缩放和懒加载。',
        'Detail-page group images: JPG / PNG / WebP / GIF, recommended 1600 × 1200 px or at least 1200 px wide, preferably under 10MB each. The storefront scales them proportionally and lazy-loads them by layout.',
      ),
    }),
  ],
};

const scenariosField: Field = {
  name: 'scenarios',
  type: 'array',
  localized: true,
  label: adminLabel('应用场景卡片（可选）'),
  admin: {
    description: adminLabel(
      '用于产品详情页“适用场景”卡片，例如“灭火救援 / 应急抢险 / 灾害处置”。不填时前台可继续使用旧模板或适用场景文本。',
    ),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: adminLabel('场景标题'),
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: adminLabel('场景说明'),
    },
  ],
};

const sellingPointsField: Field = {
  name: 'sellingPoints',
  type: 'array',
  localized: true,
  admin: {
    description: adminLabel('P3+ 扩展字段：营销卖点。'),
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
      label: adminLabel('图标'),
    }),
  ],
};

const productFaqsField: Field = {
  name: 'productFaqs',
  type: 'array',
  localized: true,
  label: adminLabel('常见问题（可选）'),
  admin: {
    description: adminLabel('直接填写该产品详情页展示的问题和答案；不需要先去关联 FAQ。'),
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      localized: true,
      label: adminLabel('问题'),
    },
    {
      name: 'answer',
      type: 'textarea',
      localized: true,
      label: adminLabel('答案'),
    },
  ],
};

const legacyFaqRelationsField: Field = {
  name: 'faqs',
  type: 'relationship',
  relationTo: 'faqs',
  hasMany: true,
  label: adminLabel('旧 FAQ 关联'),
  admin: {
    hidden: true,
  },
};

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

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: adminCollectionLabel('产品'),
    plural: adminCollectionLabel('产品'),
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    group: adminNavLabel('产品管理'),
    defaultColumns: ['model', 'name', 'productGroup', 'statusBadge', 'publishedAt', 'rowActions'],
    description: {
      en: 'Maintain storefront product cards and detail pages. Product numbers and names identify products and build links; a real main image is required before publishing.',
      zh: '维护前台产品卡片和详情页内容。产品编号和名称用于识别与链接；发布前必须上传产品主图，没有真实主图的产品不会在前台展示。',
    },
    components: {
      views: {
        edit: {
          default: {
            Component: '@/components/admin/product-editor/ProductVisualEditor',
          },
        },
      },
    },
    preview: (doc, { locale, token }) => {
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
    beforeChange: [
      requireProductMainImageOnPublish,
      requireAllLocalesOnPublish(productContentLocales, { paths: requiredProductPublishI18nPaths }),
      autoSetPublishedAtOnPublish(),
    ],
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
    i18nEditGuideField({ collectionSlug: 'products', requiredPaths: requiredProductI18nPaths }),
    draftStatusListCellField,
    draftStatusDataField,
    adminRowActionsField,
    {
      type: 'tabs',
      tabs: [
        {
          label: adminLabel('基本信息'),
          fields: [
            {
              name: 'productId',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              label: adminLabel('产品编号'),
              admin: {
                disableListColumn: true,
                description: adminLabel('稳定编号，用于前台详情页链接。创建后不建议修改。'),
              },
            },
            {
              name: 'sku',
              type: 'text',
              index: true,
              label: adminLabel('SKU / 内部编码'),
            },
            {
              name: 'model',
              type: 'text',
              index: true,
              label: adminListLabel('型号 / 规格'),
              admin: {
                description: adminLabel('可选。展示在前台详情页主图右侧和规格参数区。'),
              },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
              label: adminListLabel('产品名称'),
            },
            slugField({
              description: adminLabel('默认从 productId 生成；P2.S4 接入完整拼音与唯一性处理。'),
            }),
            {
              name: 'productGroup',
              type: 'relationship',
              relationTo: 'product-groups',
              index: true,
              required: true,
              label: adminListLabel('所属产品大类'),
              admin: {
                description: adminLabel(
                  '必填。创建产品时先选择产品大类，前台产品中心会直接把该产品放到这个大类下面。',
                ),
                components: {
                  Cell: '@/components/admin/cells/ProductGroupCell',
                },
              },
            },
          ],
        },
        {
          label: adminLabel('主图与简介'),
          fields: [
            uploadArrayField({
              name: 'images',
              label: adminLabel('产品主图（发布必填）'),
              maxRows: 1,
              uploadDescription: adminLabel(
                '产品主图建议 JPG / PNG / WebP / GIF，推荐 1600 × 1600 px 的 1:1 方图，主体居中，单图建议不超过 10MB。后台和前台会使用原图资源并按容器等比缩放展示，显示尺寸不等于上传源文件尺寸。',
                'Main product image: JPG / PNG / WebP / GIF, recommended 1600 × 1600 px 1:1 square image with the subject centered, preferably under 10MB. Admin and storefront use the original media URL and scale it proportionally inside the container; displayed size is not the uploaded source dimensions.',
              ),
            }),
            {
              name: 'description',
              type: 'richText',
              localized: true,
              label: adminLabel('产品介绍（可选）'),
              admin: {
                description: adminLabel('展示在主图右侧摘要，也会作为“商品介绍”区块的概述内容。'),
              },
            },
            textArrayField({ name: 'standards', label: adminLabel('执行标准（可选）') }),
            textArrayField({ name: 'sizeRange', label: adminLabel('尺码范围（可选）') }),
            textArrayField({
              name: 'materials',
              label: adminLabel('材料（可选）'),
              localized: true,
            }),
            featuresField,
          ],
        },
        {
          label: adminLabel('核心卖点'),
          fields: [sellingPointsField],
        },
        {
          label: adminLabel('规格参数'),
          fields: [specificationsField],
        },
        {
          label: adminLabel('尺码对应表'),
          fields: [sizeGuideField],
        },
        {
          label: adminLabel('应用场景'),
          fields: [
            textareaArrayField({
              name: 'applications',
              label: adminLabel('适用场景文本（可选）'),
              localized: true,
            }),
            scenariosField,
          ],
        },
        {
          label: adminLabel('详情页图组'),
          fields: [visualGroupsField],
        },
        {
          label: adminLabel('资料与认证状态'),
          fields: [certificationsField, qualityEvidenceField],
        },
        {
          label: adminLabel('洗护与维护'),
          fields: [textareaArrayField({ name: 'careInstructions', localized: true })],
        },
        {
          label: adminLabel('常见问题'),
          fields: [productFaqsField, legacyFaqRelationsField],
        },
        {
          label: adminLabel('SEO 搜索优化'),
          fields: [createSeoGroup({ label: adminLabel('SEO 搜索优化') })],
        },
        {
          label: adminLabel('媒体'),
          fields: [
            {
              name: 'video',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'displayOrder',
              type: 'number',
              label: adminLabel('前台展示位置'),
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
                condition: () => false,
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
