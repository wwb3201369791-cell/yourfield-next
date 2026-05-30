'use client';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function SellingPointsDrawer() {
  return (
    <SectionFieldDrawer
      title="核心卖点"
      description="维护营销卖点数组。"
      fields={[{ path: 'sellingPoints', label: '核心卖点', kind: 'readonly' }]}
    />
  );
}
