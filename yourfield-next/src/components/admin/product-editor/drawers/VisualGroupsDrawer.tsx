'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function VisualGroupsDrawer() {
  return (
    <SectionFieldDrawer
      title="详情页图组"
      description="维护详情页图组和嵌套图片。"
      fields={[
    { path: 'visualGroups', label: '图组', kind: 'readonly' },
      ]}
    />
  );
}
