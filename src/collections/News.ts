import type { CollectionConfig, Field } from 'payload';

import { canCreate, canDelete, canUpdate, isAdminOrPublished } from '../lib/payload/access';
import { adminLabel } from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import { newsCategoryOptions } from '../lib/payload/fields/options';
import { imageUploadField, videoUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { autoSetPublishedAtOnPublish } from '../lib/payload/hooks/autoPublishedAt';
import { generateSlug } from '../lib/payload/hooks/generateSlug';
import { revalidateCollectionAfterChange } from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnPublish } from '../lib/payload/hooks/validateI18nComplete';

const contentLocales = ['zh', 'en', 'ru'] as const;

const requiredI18nPaths = [
  { path: 'title', label: '新闻标题' },
  { path: 'excerpt', label: '列表摘要' },
  { path: 'content', label: '新闻正文' },
] as const;

const newsAdminLabels = {
  author: { en: 'Author / Source', zh: '作者 / 来源' },
  category: { en: 'News category (system)', zh: '新闻分类（系统）' },
  content: { en: 'Article body', zh: '新闻正文' },
  contentTab: { en: 'Article Content', zh: '正文内容' },
  cover: { en: 'Cover image', zh: '封面图' },
  excerpt: { en: 'List excerpt', zh: '列表摘要' },
  featured: { en: 'Featured news', zh: '重点新闻' },
  featuredOrder: { en: 'Featured position', zh: '重点位置' },
  featuredVideo: { en: 'English / Chinese featured card video', zh: '英文/中文重点卡片视频' },
  featuredVideoRu: { en: 'Russian featured card video', zh: '俄语重点卡片视频' },
  infoTab: { en: 'News Information', zh: '新闻信息' },
  publishedAt: { en: 'Publish time', zh: '发布时间' },
  relatedNews: { en: 'Related news', zh: '相关新闻' },
  relatedProducts: { en: 'Related products', zh: '关联产品' },
  slug: { en: 'URL slug (system)', zh: '访问链接后缀（系统）' },
  status: { en: 'Status', zh: '状态' },
  tags: { en: 'Tags', zh: '标签' },
  tagValue: { en: 'Tag value', zh: '标签内容' },
  title: { en: 'News title', zh: '新闻标题' },
} as const;

const draftStatusListCellField: Field = {
  name: 'statusBadge',
  label: newsAdminLabels.status,
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

const hiddenSlugField: Field = {
  name: 'slug',
  type: 'text',
  label: newsAdminLabels.slug,
  required: true,
  unique: true,
  index: true,
  admin: {
    hidden: true,
    disableListColumn: true,
    disableListFilter: true,
    description: adminLabel('留空从标题生成；P2.S4 接入完整拼音与唯一性处理。'),
  },
  hooks: {
    beforeValidate: [generateSlug],
  },
};

export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    singular: { en: 'News', zh: '新闻动态' },
    plural: { en: 'News', zh: '新闻动态' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'statusBadge', 'featuredOrder', 'publishedAt'],
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
    create: canCreate('news'),
    update: canUpdate('news'),
    delete: canDelete('news'),
  },
  hooks: {
    beforeChange: [
      requireAllLocalesOnPublish(contentLocales, { paths: requiredI18nPaths }),
      autoSetPublishedAtOnPublish(),
    ],
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
          label: newsAdminLabels.infoTab,
          fields: [
            {
              name: 'title',
              label: newsAdminLabels.title,
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'excerpt',
              label: newsAdminLabels.excerpt,
              type: 'textarea',
              localized: true,
              admin: {
                description: adminLabel('显示在新闻列表和详情页标题下方；留空时前台会从正文截取。'),
              },
            },
            {
              name: 'author',
              label: newsAdminLabels.author,
              type: 'text',
              defaultValue: '永霏集团',
            },
            imageUploadField({
              name: 'cover',
              label: newsAdminLabels.cover,
              admin: {
                description: adminLabel(
                  '用于新闻列表和详情页的静态封面。视频新闻可不上传；没有视频时建议上传，避免前台只显示占位图。',
                ),
              },
            }),
            videoUploadField({
              name: 'featuredVideo',
              label: newsAdminLabels.featuredVideo,
              admin: {
                description: adminLabel(
                  '用于新闻中心顶部三张大卡片的视频预览。中文和英文页面使用这个视频；封面图会作为视频封面帧。不上传视频时，前台会退回显示封面图。',
                ),
              },
            }),
            videoUploadField({
              name: 'featuredVideoRu',
              label: newsAdminLabels.featuredVideoRu,
              admin: {
                description: adminLabel(
                  '用于俄语页面的重点新闻速览视频；客户提供俄语素材后替换这里。未上传时俄语页面会回退使用英文/中文视频。',
                ),
              },
            }),
            {
              name: 'category',
              label: newsAdminLabels.category,
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
              label: newsAdminLabels.publishedAt,
              type: 'date',
              index: true,
              admin: {
                condition: () => false,
                position: 'sidebar',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: adminLabel('系统在点击发布时自动写入，用于前台显示日期和新闻排序。'),
              },
            },
            {
              name: 'featuredOrder',
              label: newsAdminLabels.featuredOrder,
              type: 'number',
              min: 0,
              max: 3,
              index: true,
              admin: {
                position: 'sidebar',
                description: adminLabel(
                  '控制新闻中心顶部三张重点新闻卡片和首页新闻预览顺序；直接填 1、2、3，数字越小越靠前。留空或 0 表示按发布时间补位。',
                ),
              },
            },
            {
              name: 'isFeatured',
              label: newsAdminLabels.featured,
              type: 'checkbox',
              defaultValue: false,
              index: true,
              admin: {
                position: 'sidebar',
                disableListColumn: true,
                description: adminLabel(
                  '勾选后进入首页和新闻中心顶部重点位；如果已填写重点位置，也会自动作为重点新闻参与排序。',
                ),
              },
            },
          ],
        },
        {
          label: newsAdminLabels.contentTab,
          fields: [
            {
              name: 'content',
              label: newsAdminLabels.content,
              type: 'richText',
              localized: true,
              required: true,
              admin: {
                description: adminLabel(
                  '新闻正文支持段落、标题、列表和媒体图片；插入图片后，前台详情页会以独立图片区块展示。',
                ),
              },
            },
          ],
        },
      ],
    },
    {
      name: 'tags',
      label: newsAdminLabels.tags,
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
          label: newsAdminLabels.tagValue,
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'relatedNews',
      label: newsAdminLabels.relatedNews,
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
      label: newsAdminLabels.relatedProducts,
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
