'use client';

import React, { lazy, Suspense } from 'react';

import type { I18nEditGuideProps } from './I18nEditGuide';

const I18nEditGuide = lazy(() => import('./I18nEditGuide'));

export default function I18nEditGuideLoader(props: I18nEditGuideProps) {
  return (
    <Suspense fallback={<div className="yf-i18n-guide">正在加载三语编辑入口...</div>}>
      <I18nEditGuide {...props} />
    </Suspense>
  );
}
