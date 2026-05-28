'use client';

import type { AdminViewProps } from 'payload/config';
import React, { lazy, Suspense } from 'react';

const ProductVisualEditor = lazy(() => import('./ProductVisualEditor'));

export default function ProductVisualEditorLoader(props: AdminViewProps) {
  return (
    <Suspense fallback={<div className="ype-loading">正在加载产品可视化编辑器…</div>}>
      <ProductVisualEditor {...props} />
    </Suspense>
  );
}
