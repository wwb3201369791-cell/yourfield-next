import type { CollectionConfig } from 'payload/types';

import { canCreate, canDelete, canUpdate, isPublic } from '../lib/payload/access';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import { mediaFolderOptions } from '../lib/payload/fields/options';
import { enforceMediaUploadLimit } from '../lib/payload/hooks/enforceMediaUploadLimit';
import { validateLocalizedAlt } from '../lib/payload/hooks/validateLocalizedAlt';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: '媒体文件',
    plural: '媒体文件',
  },
  admin: {
    useAsTitle: 'filename',
    group: '内容管理',
    hidden: true,
  },
  access: {
    read: isPublic,
    create: canCreate('media'),
    update: canUpdate('media'),
    delete: canDelete('media'),
  },
  upload: {
    staticURL: '/media',
    staticDir: 'uploads',
    imageSizes: [
      { name: 'thumbnail', width: 200, height: 200, position: 'centre' },
      { name: 'card', width: 600, height: 400, position: 'centre' },
      { name: 'feature', width: 1024, height: 768 },
      { name: 'hero', width: 1920, height: 1080 },
      { name: 'mobile', width: 480, height: 640 },
      { name: 'og', width: 1200, height: 630 },
    ],
    formatOptions: {
      format: 'webp',
      options: {
        quality: 82,
      },
    },
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf'],
  },
  hooks: {
    beforeOperation: [enforceMediaUploadLimit],
    beforeValidate: [validateLocalizedAlt],
    afterChange: [auditAfterChange('media')],
    afterDelete: [auditAfterDelete('media')],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: '无障碍替代文本，zh / en / ru 必须全部填写。',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'credit',
      type: 'text',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'folder',
      type: 'select',
      options: mediaFolderOptions,
      defaultValue: 'misc',
      index: true,
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description: 'P2.S4 媒体引用统计 hook 自动维护。',
      },
    },
  ],
};
