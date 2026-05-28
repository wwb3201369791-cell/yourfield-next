'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function HeroDrawer() {
  return (
    <SectionFieldDrawer
      title="主图与简介"
      description="编辑详情页首屏会直接显示的名称、型号、介绍和图片。"
      fields={[
        { path: 'name', label: '产品名称 *', kind: 'text' },
        { path: 'model', label: '型号', kind: 'text', localized: false },
        { path: 'description', label: '产品介绍', kind: 'textarea' },
        { path: 'standards', label: '执行标准', kind: 'array', localized: false },
        { path: 'materials', label: '材料', kind: 'array' },
        {
          path: 'images',
          label: '产品主图',
          kind: 'upload-array',
          localized: false,
          maxRows: 1,
          help: '前台首屏只展示这一张主图；场景图、建模图和模特图请放到下方详情页图组。',
        },
      ]}
    />
  );
}
