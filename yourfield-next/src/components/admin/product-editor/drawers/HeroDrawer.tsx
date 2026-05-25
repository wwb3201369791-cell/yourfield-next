'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function HeroDrawer() {
  return (
    <SectionFieldDrawer
      title="主图与简介"
      description="编辑 Hero 卡片中的名称、型号、介绍和图片摘要。"
      fields={[
    { path: 'name', label: '产品名称 *', kind: 'text' },
    { path: 'model', label: '型号', kind: 'text' },
    { path: 'description', label: '产品介绍', kind: 'textarea' },
    { path: 'images', label: '产品图片', kind: 'readonly' },
      ]}
    />
  );
}
