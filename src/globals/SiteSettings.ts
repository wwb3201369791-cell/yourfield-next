import type { Field, GlobalConfig } from 'payload';

import { canUpdate, isPublic } from '../lib/payload/access';
import { auditGlobalAfterChange } from '../lib/payload/audit';
import { i18nEditGuideField } from '../lib/payload/fields/i18nEditGuide';
import {
  localeOptions,
  mapServiceOptions,
  socialPlatformOptions,
} from '../lib/payload/fields/options';
import { createSeoGroup } from '../lib/payload/fields/seo';
import { imageUploadField } from '../lib/payload/fields/simpleMediaUpload';
import { revalidateGlobalAfterChange } from '../lib/payload/hooks/revalidateContent';
import { requireAllLocalesOnGlobalSave } from '../lib/payload/hooks/validateI18nComplete';

const contentLocales = ['zh', 'en', 'ru'] as const;

const contactRequiredI18nPaths = [{ path: 'contact.address', label: '地址' }] as const;

const requiredI18nPaths = [
  ...contactRequiredI18nPaths,
  { path: 'siteName', label: '站点名称' },
  { path: 'tagline', label: '站点标语' },
  { path: 'defaultSeo.title', label: '默认 SEO 标题' },
  { path: 'defaultSeo.description', label: '默认 SEO 描述' },
  { path: 'defaultSeo.keywords', label: '默认 SEO 关键词' },
  { path: 'cookieConsent.title', label: 'Cookie 标题' },
  { path: 'cookieConsent.description', label: 'Cookie 说明' },
  { path: 'cookieConsent.acceptLabel', label: 'Cookie 接受按钮' },
  { path: 'cookieConsent.rejectLabel', label: 'Cookie 拒绝按钮' },
  { path: 'cookieConsent.essentialOnlyLabel', label: 'Cookie 仅必要按钮' },
] as const;

const hiddenAdminField = {
  admin: {
    hidden: true,
  },
} satisfies Pick<Field, 'admin'>;

const hiddenDefaultSeo = {
  ...createSeoGroup({ name: 'defaultSeo', label: '默认 SEO' }),
  admin: {
    hidden: true,
  },
} as Field;

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '联系方式',
  admin: {
    group: '全局设置',
    hideAPIURL: true,
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
    read: isPublic,
    update: canUpdate('site-settings'),
  },
  hooks: {
    beforeChange: [
      requireAllLocalesOnGlobalSave(contentLocales, {
        paths: requiredI18nPaths,
      }),
    ],
    afterChange: [
      auditGlobalAfterChange('site-settings'),
      revalidateGlobalAfterChange('site-settings'),
    ],
  },
  fields: [
    i18nEditGuideField({
      globalSlug: 'site-settings',
      requiredPaths: contactRequiredI18nPaths,
    }),
    {
      type: 'tabs',
      tabs: [
        {
          label: '联系方式',
          fields: [
            {
              name: 'contact',
              label: '联系信息',
              type: 'group',
              fields: [
                {
                  name: 'phone',
                  label: '电话',
                  type: 'text',
                  defaultValue: '400-6800181',
                },
                {
                  name: 'email',
                  label: '邮箱',
                  type: 'email',
                  defaultValue: 'hnyf@yourfield.net',
                },
                {
                  name: 'address',
                  label: '地址',
                  type: 'textarea',
                  localized: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'coordinates',
      ...hiddenAdminField,
      type: 'group',
      fields: [
        {
          name: 'lat',
          type: 'number',
          defaultValue: 27.816329,
        },
        {
          name: 'lng',
          type: 'number',
          defaultValue: 112.989066,
        },
        {
          name: 'zoom',
          type: 'number',
          defaultValue: 15,
          min: 1,
          max: 20,
        },
      ],
    },
    {
      name: 'socials',
      ...hiddenAdminField,
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: socialPlatformOptions,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        imageUploadField({
          name: 'icon',
          label: '图标',
        }),
      ],
    },
    {
      name: 'siteName',
      ...hiddenAdminField,
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'tagline',
      ...hiddenAdminField,
      type: 'text',
      localized: true,
    },
    {
      name: 'logo',
      ...hiddenAdminField,
      type: 'group',
      fields: [
        imageUploadField({
          name: 'light',
          label: '浅色 Logo',
          required: true,
        }),
        imageUploadField({
          name: 'dark',
          label: '深色 Logo',
          required: true,
        }),
      ],
    },
    {
      name: 'themeColor',
      ...hiddenAdminField,
      type: 'text',
      required: true,
      defaultValue: '#1e3a5f',
    },
    hiddenDefaultSeo,
    {
      name: 'mapServiceByLocale',
      ...hiddenAdminField,
      type: 'array',
      defaultValue: [
        { locale: 'zh', service: 'amap' },
        { locale: 'en', service: 'google' },
        { locale: 'ru', service: 'google' },
      ],
      fields: [
        {
          name: 'locale',
          type: 'select',
          required: true,
          options: localeOptions,
        },
        {
          name: 'service',
          type: 'select',
          required: true,
          options: mapServiceOptions,
        },
      ],
    },
    {
      name: 'cookieConsent',
      ...hiddenAdminField,
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'acceptLabel',
          type: 'text',
          localized: true,
        },
        {
          name: 'rejectLabel',
          type: 'text',
          localized: true,
        },
        {
          name: 'essentialOnlyLabel',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'analytics',
      ...hiddenAdminField,
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'umamiWebsiteId',
          type: 'text',
          admin: {
            description: '仅保存公开 websiteId；不要填写 API Key。',
          },
        },
      ],
    },
    {
      name: 'icp',
      ...hiddenAdminField,
      type: 'text',
      required: true,
      defaultValue: '湘ICP备18013725号-1',
    },
    {
      name: 'publicSecurityRecord',
      ...hiddenAdminField,
      type: 'text',
      admin: {
        hidden: true,
        description: '[NEEDS-INPUT] 格式：湘公网安备 XXXXXXXXXXXXX号。',
      },
    },
  ],
};
