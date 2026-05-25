'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function SpecDrawer() {
  return (
    <SectionFieldDrawer
      title="规格参数"
      description="维护详情页参数表。"
      fields={[
    { path: 'specifications', label: '规格参数', kind: 'readonly' },
      ]}
    />
  );
}
