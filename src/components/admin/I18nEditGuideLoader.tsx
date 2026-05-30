'use client';

import { lazy, Suspense } from 'react';

import type { I18nEditGuideProps } from './I18nEditGuide';
import { useAdminText } from './adminUiLocale';

const I18nEditGuide = lazy(() => import('./I18nEditGuide'));

export default function I18nEditGuideLoader(props: I18nEditGuideProps) {
  const t = useAdminText();

  return (
    <Suspense fallback={<div className="yf-i18n-guide">{t('正在加载三语编辑入口...')}</div>}>
      <I18nEditGuide {...props} />
    </Suspense>
  );
}
