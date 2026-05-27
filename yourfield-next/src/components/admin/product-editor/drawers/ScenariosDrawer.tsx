'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function ScenariosDrawer() {
  return (
    <SectionFieldDrawer
      title="适用场景"
      description="维护场景卡片或适用场景文本。"
      fields={[
        { path: 'scenarios', label: '场景卡片', kind: 'readonly' },
        { path: 'applications', label: '适用场景文本', kind: 'array' },
      ]}
    />
  );
}
