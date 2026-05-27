import type { AfterChangeHook } from 'payload/dist/collections/config/types';
import type { CollectionConfig } from 'payload/types';

import SubmissionStatusCell from '../components/admin/cells/SubmissionStatusCell';
import { FormSubmissionsListGuide } from '../components/admin/list/FormSubmissionsListGuide';
import { FormSubmissionsStatusTabs } from '../components/admin/list/FormSubmissionsStatusTabs';
import { sendNotification } from '../lib/email/sendNotification';
import { canDelete, canRead, canUpdate, deny } from '../lib/payload/access';
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

  await sendNotification({ req, submission: doc });

  return doc;
};

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: {
    singular: '咨询表单',
    plural: '咨询表单',
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    listSearchableFields: ['name'],
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
      AfterList: [FormSubmissionsListGuide],
      BeforeList: [FormSubmissionsStatusTabs],
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
          label: '客户信息',
          fields: [
            {
              name: 'name',
              label: '姓名',
              type: 'text',
              required: true,
            },
            {
              name: 'country',
              label: '国家 / 地区',
              type: 'text',
            },
            {
              name: 'company',
              label: '公司',
              type: 'text',
            },
            {
              name: 'position',
              label: '职位',
              type: 'text',
            },
            {
              name: 'phone',
              label: '电话',
              type: 'text',
              required: true,
            },
            {
              name: 'email',
              label: '邮箱',
              type: 'email',
              required: true,
            },
          ],
        },
        {
          label: '咨询内容',
          fields: [
            {
              name: 'inquiryType',
              label: '咨询类型',
              type: 'select',
              required: true,
              options: inquiryTypeOptions,
              defaultValue: 'message',
              index: true,
            },
            {
              name: 'message',
              label: '留言内容',
              type: 'textarea',
              required: true,
            },
            {
              name: 'productRef',
              label: '关联产品',
              type: 'relationship',
              relationTo: 'products',
            },
          ],
        },
        {
          label: '处理跟进',
          fields: [
            {
              name: 'status',
              label: '处理状态',
              type: 'select',
              required: true,
              options: submissionStatusOptions,
              defaultValue: 'new',
              index: true,
              admin: {
                components: {
                  Cell: SubmissionStatusCell,
                },
              },
            },
            {
              name: 'assignedTo',
              label: '负责人',
              type: 'text',
              admin: {
                description: '直接填写线下跟进人姓名。',
              },
            },
            {
              name: 'notes',
              label: '跟进记录',
              type: 'array',
              fields: [
                {
                  name: 'at',
                  label: '时间',
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
                  label: '跟进人',
                  type: 'text',
                  admin: {
                    description: '直接填写跟进人姓名。',
                  },
                },
                {
                  name: 'text',
                  label: '记录内容',
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
      label: '来源页面（系统）',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
        description: '由提交页面自动记录。',
      },
    },
    {
      name: 'sourceLocale',
      label: '来源语言（系统）',
      type: 'select',
      options: localeOptions,
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'ip',
      label: 'IP 地址（系统）',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'userAgent',
      label: '浏览器信息（系统）',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'consentAcceptedAt',
      label: '隐私同意时间（系统）',
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
      label: '软删除时间（系统）',
      type: 'date',
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
        description: '仅系统在软删除流程中写入；为空表示当前记录正常。',
      },
    },
  ],
};
