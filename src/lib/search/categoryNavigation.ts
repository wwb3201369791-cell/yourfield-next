import type { Locale } from '@/lib/i18n/locale';

type CategorySearchRule = Readonly<{
  groupId:
    | 'chemical-medical'
    | 'electrical-protection'
    | 'fire-rescue'
    | 'thermal-welding'
    | 'water-rescue';
  keywords: readonly string[];
}>;

const broadSearchTerms = new Set([
  'ppe',
  '产品',
  '劳保',
  '工作服',
  '服装',
  '消防',
  '装备',
  '防护',
  '防护服',
  'protectiveclothing',
  'protectivesuit',
]);

const categorySearchRules: readonly CategorySearchRule[] = [
  {
    groupId: 'water-rescue',
    keywords: ['水域救援', '水上救援', '激流救援', '防汛救援', '水域防护', 'waterrescue'],
  },
  {
    groupId: 'electrical-protection',
    keywords: [
      '电气作业',
      '电力防护',
      '防电弧',
      '电弧服',
      '带电作业',
      '屏蔽服',
      '绝缘防护',
      '防静电服',
      'arcflash',
      'electricalprotection',
    ],
  },
  {
    groupId: 'thermal-welding',
    keywords: [
      '热工防护',
      '焊接防护',
      '焊接服',
      '焊工服',
      '阻燃服',
      '隔热服',
      '防喷溅服',
      'weldingprotection',
      'thermalprotection',
    ],
  },
  {
    groupId: 'chemical-medical',
    keywords: [
      '化学防护',
      '医用防护',
      '化学与医用',
      '防化服',
      '化工防护',
      '医疗防护',
      '隔离服',
      '微波辐射',
      'chemicalprotection',
      'medicalprotection',
    ],
  },
  {
    groupId: 'fire-rescue',
    keywords: [
      '消防救援',
      '消防救援防护',
      '抢险救援',
      '灭火救援',
      '灭火防护',
      '森林灭火',
      '应急救援',
      'firerescue',
      'firefighterrescue',
    ],
  },
];

function normalizeCategorySearchTerm(value: string | undefined) {
  return (value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\s\-_./\\,，。:：;；()[\]{}（）【】"'“”‘’]+/g, '')
    .trim();
}

function productGroupHref(locale: Locale, groupId: CategorySearchRule['groupId']) {
  return `/${locale}/products#${groupId}`;
}

export function categorySearchHrefFor(locale: Locale, query: string) {
  const normalizedQuery = normalizeCategorySearchTerm(query);

  if (!normalizedQuery || broadSearchTerms.has(normalizedQuery)) {
    return null;
  }

  const matchedRule = categorySearchRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedQuery.includes(normalizeCategorySearchTerm(keyword))),
  );

  return matchedRule ? productGroupHref(locale, matchedRule.groupId) : null;
}
