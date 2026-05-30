'use client';

import type { AdminViewProps } from 'payload';
import { lazy, Suspense } from 'react';

import { useAdminText } from '../adminUiLocale';

const ProductVisualEditor = lazy(() => import('./ProductVisualEditor'));

export default function ProductVisualEditorLoader(props: AdminViewProps) {
  const t = useAdminText();

  return (
    <Suspense fallback={<div className="ype-loading">{t('正在加载产品可视化编辑器…')}</div>}>
      <ProductVisualEditor {...props} />
    </Suspense>
  );
}
