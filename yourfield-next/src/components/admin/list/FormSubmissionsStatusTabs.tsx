'use client';

import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import React from 'react';

import { StatusTabs, type StatusTabOption } from './StatusTabs';

const formSubmissionStatusTabs: readonly StatusTabOption[] = [
  { label: '全部' },
  { label: '新咨询', value: 'new' },
  { label: '处理中', value: 'processing' },
  { label: '已回复', value: 'replied' },
  { label: '已关闭', value: 'closed' },
];

export function FormSubmissionsStatusTabs() {
  const { routes } = useConfig();

  return (
    <StatusTabs
      adminBase={routes.admin}
      apiBase={routes.api}
      collectionSlug="form-submissions"
      description="按处理进度快速收拢线索，优先跟进新咨询。"
      options={formSubmissionStatusTabs}
      title="咨询状态"
    />
  );
}
