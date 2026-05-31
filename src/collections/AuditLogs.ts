import type { CollectionConfig } from 'payload';

import { canRead, deny } from '../lib/payload/access';
import { adminCollectionLabel, adminLabel } from '../lib/payload/adminText';
import { auditActionOptions } from '../lib/payload/fields/options';

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: {
    singular: adminCollectionLabel('审计日志'),
    plural: adminCollectionLabel('审计日志'),
  },
  admin: {
    useAsTitle: 'action',
    group: adminLabel('系统设置'),
    defaultColumns: ['action', 'userEmail', 'collection', 'documentId', 'createdAt'],
    hidden: true,
  },
  access: {
    read: canRead('audit-logs'),
    create: deny,
    update: deny,
    delete: deny,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'userEmail',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: auditActionOptions,
      index: true,
    },
    {
      name: 'collection',
      type: 'text',
      index: true,
    },
    {
      name: 'documentId',
      type: 'text',
      index: true,
    },
    {
      name: 'documentSnapshot',
      type: 'json',
    },
    {
      name: 'ip',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'textarea',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
};
