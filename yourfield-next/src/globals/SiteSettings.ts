import type { Field, GlobalConfig } from 'payload/types';

import { canUpdate, isPublic } from '../lib/payload/access';
import { auditGlobalAfterChange } from '../lib/payload/audit';
import {
  localeOptions,
  mapServiceOptions,
  socialPlatformOptions,
} from '../lib/payload/fields/options';
import { createSeoGroup } from '../lib/payload/fields/seo';
import { revalidateGlobalAfterChange } from '../lib/payload/hooks/revalidateContent';

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
    group: '联系方式',
    hideAPIURL: true,
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
    update: canUpdate('site-settings'),
  },
  hooks: {
    afterChange: [
      auditGlobalAfterChange('site-settings'),
      revalidateGlobalAfterChange('site-settings'),
    ],
  },
  fields: [
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
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
        },
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
        {
          name: 'light',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'dark',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'favicon',
      ...hiddenAdminField,
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'appleTouchIcon',
      ...hiddenAdminField,
      type: 'upload',
      relationTo: 'media',
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
