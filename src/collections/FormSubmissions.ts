import type { CollectionAfterChangeHook as AfterChangeHook, CollectionConfig } from 'payload';

import { sendNotification } from '../lib/email/sendNotification';
import { canDelete, canRead, canUpdate, deny } from '../lib/payload/access';
import { adminCollectionLabel, adminLabel, adminNavLabel } from '../lib/payload/adminText';
import { auditAfterChange, auditAfterDelete } from '../lib/payload/audit';
import {
  inquiryTypeOptions,
  localeOptions,
  submissionStatusOptions,
} from '../lib/payload/fields/options';

type FormSubmissionDocument = Record<string, unknown> & { id: string | number };

const notifyAfterCreate: AfterChangeHook<FormSubmissionDocument> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') {
    return doc;
  }

  try {
    await sendNotification({ req, submission: doc });
  } catch (error) {
    console.warn('[form-submissions] notify failed', {
      error: error instanceof Error ? error.message : 'Unknown notify error',
    });
  }

  return doc;
};

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: {
    singular: adminCollectionLabel('咨询表单'),
    plural: adminCollectionLabel('咨询表单'),
  },
  admin: {
    group: adminNavLabel('内容管理'),
    hideAPIURL: true,
    useAsTitle: 'name',
    listSearchableFields: ['name', 'phone', 'email', 'company'],
    defaultColumns: [
      'inquiryType',
      'name',
      'email',
      'phone',
      'status',
      'createdAt',
      'company',
      'country',
    ],
    components: {
      beforeList: ['@/components/admin/list/FormSubmissionsStatusTabs#FormSubmissionsStatusTabs'],
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
    read: canRead('form-submissions'),
    create: deny,
    update: canUpdate('form-submissions'),
    delete: canDelete('form-submissions'),
  },
  hooks: {
    afterChange: [auditAfterChange('form-submissions'), notifyAfterCreate],
    afterDelete: [auditAfterDelete('form-submissions')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: adminLabel('客户信息'),
          fields: [
            {
              name: 'name',
              label: adminLabel('姓名'),
              type: 'text',
              required: true,
            },
            {
              name: 'country',
              label: adminLabel('国家 / 地区'),
              type: 'text',
            },
            {
              name: 'company',
              label: adminLabel('公司'),
              type: 'text',
            },
            {
              name: 'position',
              label: adminLabel('职位'),
              type: 'text',
            },
            {
              name: 'phone',
              label: adminLabel('电话'),
              type: 'text',
              required: true,
            },
            {
              name: 'email',
              label: adminLabel('邮箱'),
              type: 'email',
              required: true,
            },
          ],
        },
        {
          label: adminLabel('咨询内容'),
          fields: [
            {
              name: 'inquiryType',
              label: adminLabel('咨询类型'),
              type: 'select',
              required: true,
              options: inquiryTypeOptions,
              defaultValue: 'message',
              index: true,
            },
            {
              name: 'message',
              label: adminLabel('留言内容'),
              type: 'textarea',
              required: true,
            },
            {
              name: 'productRef',
              label: adminLabel('关联产品'),
              type: 'relationship',
              relationTo: 'products',
            },
          ],
        },
        {
          label: adminLabel('处理跟进'),
          fields: [
            {
              name: 'status',
              label: adminLabel('处理状态'),
              type: 'select',
              required: true,
              options: submissionStatusOptions,
              defaultValue: 'new',
              index: true,
              admin: {
                components: {
                  Cell: '@/components/admin/cells/SubmissionStatusCell',
                },
              },
            },
            {
              name: 'assignedTo',
              label: adminLabel('负责人'),
              type: 'text',
              admin: {
                description: adminLabel('直接填写线下跟进人姓名。'),
              },
            },
            {
              name: 'notes',
              label: adminLabel('跟进记录'),
              type: 'array',
              fields: [
                {
                  name: 'at',
                  label: adminLabel('时间'),
                  type: 'date',
                  required: true,
                  defaultValue: () => new Date().toISOString(),
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  name: 'user',
                  label: adminLabel('跟进人'),
                  type: 'text',
                  admin: {
                    description: adminLabel('直接填写跟进人姓名。'),
                  },
                },
                {
                  name: 'text',
                  label: adminLabel('记录内容'),
                  type: 'textarea',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'sourceUrl',
      label: adminLabel('来源页面（系统）'),
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
        description: adminLabel('由提交页面自动记录。'),
      },
    },
    {
      name: 'sourceLocale',
      label: adminLabel('来源语言（系统）'),
      type: 'select',
      options: localeOptions,
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'ip',
      label: adminLabel('IP 地址（系统）'),
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'userAgent',
      label: adminLabel('浏览器信息（系统）'),
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'consentAcceptedAt',
      label: adminLabel('隐私同意时间（系统）'),
      type: 'date',
      required: true,
      admin: {
        hidden: true,
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'deletedAt',
      label: adminLabel('软删除时间（系统）'),
      type: 'date',
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
        description: adminLabel('仅系统在软删除流程中写入；为空表示当前记录正常。'),
      },
    },
  ],
};
