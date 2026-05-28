'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function SpecDrawer() {
  return (
    <SectionFieldDrawer
      title="参数规格"
      description="维护详情页参数表。"
      fields={[{ path: 'specifications', label: '参数规格', kind: 'readonly' }]}
    />
  );
}
