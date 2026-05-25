'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function OperationsDrawer() {
  return (
    <SectionFieldDrawer
      title="运营字段"
      description="维护 SEO、标识、上架和关联字段。"
      fields={[
    { path: 'productId', label: '产品编号', kind: 'text' },
    { path: 'sku', label: 'SKU', kind: 'text' },
    { path: 'slug', label: 'Slug', kind: 'text' },
    { path: 'productGroup', label: '产品大类', kind: 'readonly' },
    { path: 'industries', label: '行业', kind: 'readonly' },
    { path: 'tags', label: '标签', kind: 'array' },
    { path: 'relatedProducts', label: '关联产品', kind: 'readonly' },
    { path: 'isFeatured', label: '首页推荐', kind: 'readonly' },
    { path: 'displayOrder', label: '排序', kind: 'text' },
    { path: 'publishedAt', label: '发布时间', kind: 'text' },
    { path: 'seo', label: 'SEO', kind: 'readonly' },
      ]}
    />
  );
}
