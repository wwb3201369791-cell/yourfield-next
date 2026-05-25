'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function FaqDrawer() {
  return (
    <SectionFieldDrawer
      title="常见问题"
      description="维护 FAQ 关系。"
      fields={[
    { path: 'faqs', label: 'FAQ 关系', kind: 'readonly' },
      ]}
    />
  );
}
