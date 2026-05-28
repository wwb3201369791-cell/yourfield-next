'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function IntroDrawer() {
  return (
    <SectionFieldDrawer
      title="商品介绍"
      description="编辑概述、材料、特点和适用场景文本。"
      fields={[
    { path: 'description', label: '概述', kind: 'textarea' },
    { path: 'materials', label: '材料', kind: 'array' },
    { path: 'features', label: '产品特点', kind: 'readonly' },
    { path: 'applications', label: '适用场景', kind: 'array' },
      ]}
    />
  );
}
