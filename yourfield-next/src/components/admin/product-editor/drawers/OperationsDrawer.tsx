'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function OperationsDrawer() {
  return (
    <SectionFieldDrawer
      title="产品标识"
      description="只保留需要人工确认的产品编号和产品大类；Slug、数据库 ID、发布时间等系统字段会自动处理。"
      fields={[
        { path: 'productId', label: '产品编号', kind: 'text', localized: false },
        { path: 'sku', label: 'SKU', kind: 'text', localized: false },
        {
          path: 'productGroup',
          label: '产品大类',
          kind: 'relationship',
          localized: false,
          relationTo: 'product-groups',
          help: '这个字段决定产品在前台产品中心属于哪个大类。',
        },
      ]}
    />
  );
}
