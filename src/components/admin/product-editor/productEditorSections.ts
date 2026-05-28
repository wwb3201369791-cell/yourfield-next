import type { SidebarItem } from '@/components/product-detail/sections';

import type { EditorSection } from './hooks/useEditorContext';

export type ProductEditorDetailSection = Readonly<{
  emptyHint: string;
  id: string;
  label: string;
  section: EditorSection;
}>;

export const productEditorDetailSections = [
  {
    emptyHint: '概述 / 材料 / 特点 / 适用场景',
    id: 'product-intro',
    label: '商品介绍',
    section: 'intro',
  },
  {
    emptyHint: '添加卖点标题和说明',
    id: 'selling-points',
    label: '核心卖点',
    section: 'selling-points',
  },
  {
    emptyHint: '添加参数名和值',
    id: 'specifications',
    label: '参数规格',
    section: 'specifications',
  },
  {
    emptyHint: '可选：添加尺码对应表',
    id: 'size-guide',
    label: '尺码对应表',
    section: 'size-guide',
  },
  {
    emptyHint: '添加场景标题和说明',
    id: 'application-scenarios',
    label: '适用场景',
    section: 'scenarios',
  },
  {
    emptyHint: '添加场景图 / 建模图 / 模特图',
    id: 'visual-gallery',
    label: '场景图、建模图与模特上身图',
    section: 'visual-groups',
  },
  {
    emptyHint: '添加质量证据和认证状态',
    id: 'quality-evidence',
    label: '资料与认证状态',
    section: 'evidence',
  },
  {
    emptyHint: '添加洗护说明',
    id: 'care-instructions',
    label: '洗护与维护',
    section: 'care',
  },
  {
    emptyHint: '关联常见问题',
    id: 'faq',
    label: '常见问题',
    section: 'faq',
  },
] as const satisfies readonly ProductEditorDetailSection[];

export const productEditorDetailNavItems: readonly SidebarItem[] = productEditorDetailSections.map(
  ({ id, label }) => ({ id, label }),
);
