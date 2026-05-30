'use client';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function OperationsDrawer() {
  return (
    <SectionFieldDrawer
      title="展示顺序"
      description="只控制这个产品在所属大类里的展示排序。产品编号和详情页链接由系统生成。"
      fields={[
        {
          path: 'displayOrder',
          label: '大类内展示顺序',
          kind: 'number',
          localized: false,
          help: '直接填 1、2、3；数字越小越靠前；留空或 0 表示不优先排序。',
        },
      ]}
    />
  );
}
