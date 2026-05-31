export const productContentLocales = ['zh', 'en', 'ru'] as const;

export type ProductContentLocale = (typeof productContentLocales)[number];

export type RequiredProductI18nPath = Readonly<{
  path: string;
  label: string;
}>;

export const requiredProductI18nPaths = [
  { path: 'name', label: '产品名称' },
  { path: 'description', label: '产品介绍' },
  { path: 'materials', label: '材料' },
  { path: 'materials.value', label: '材料' },
  { path: 'features', label: '产品特点' },
  { path: 'features.title', label: '产品特点标题' },
  { path: 'features.description', label: '产品特点说明' },
  { path: 'sellingPoints', label: '营销卖点' },
  { path: 'sellingPoints.title', label: '卖点标题' },
  { path: 'sellingPoints.text', label: '卖点说明' },
  { path: 'specifications', label: '详情页参数表' },
  { path: 'specifications.label', label: '参数名' },
  { path: 'specifications.value', label: '参数值' },
  { path: 'applications', label: '适用场景文本' },
  { path: 'applications.value', label: '适用场景文本' },
  { path: 'scenarios', label: '应用场景卡片' },
  { path: 'scenarios.title', label: '场景标题' },
  { path: 'scenarios.description', label: '场景说明' },
  { path: 'visualGroups', label: '详情页图片分组' },
  { path: 'visualGroups.title', label: '分组标题' },
  { path: 'visualGroups.description', label: '分组说明' },
  { path: 'careInstructions', label: '洗护维护说明' },
  { path: 'careInstructions.value', label: '洗护维护说明' },
  { path: 'qualityEvidence', label: '质量证据' },
  { path: 'qualityEvidence.title', label: '质量证据标题' },
  { path: 'qualityEvidence.description', label: '质量证据说明' },
] as const satisfies readonly RequiredProductI18nPath[];

export const requiredProductPublishI18nPaths = [
  { path: 'name', label: '产品名称' },
  { path: 'description', label: '产品介绍' },
] as const satisfies readonly RequiredProductI18nPath[];
