'use client';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function CareDrawer() {
  return (
    <SectionFieldDrawer
      title="洗护与维护"
      description="维护洗护说明列表。"
      fields={[{ path: 'careInstructions', label: '洗护说明', kind: 'array' }]}
    />
  );
}
