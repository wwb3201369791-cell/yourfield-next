'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function SizeGuideDrawer() {
  return (
    <SectionFieldDrawer
      title="尺码对应表"
      description="维护尺码表标题、列和行。"
      fields={[
    { path: 'sizeGuide', label: '尺码表', kind: 'readonly' },
      ]}
    />
  );
}
