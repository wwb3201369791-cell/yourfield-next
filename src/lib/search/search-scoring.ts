import type { SearchHitType } from '@/lib/search/types';

import type { SearchCandidate, WeightedField } from './search-candidates';
import { normalizeCompactSearchText, normalizeSearchText, tokenizeQuery } from './search-text';

export const searchTypeOrder: Record<SearchHitType, number> = {
  product: 0,
  solution: 1,
  'industry-case': 2,
  news: 3,
  page: 4,
  faq: 5,
};

function scoreField(field: WeightedField, normalizedQuery: string, tokens: readonly string[]) {
  const text = normalizeSearchText(field.text);
  const compactText = normalizeCompactSearchText(field.text);
  const compactQuery = normalizeCompactSearchText(normalizedQuery);
  const isIdentifierQuery = /\p{L}/u.test(compactQuery) && /\p{N}/u.test(compactQuery);

  if (!text) {
    return 0;
  }

  let score = 0;

  if (text === normalizedQuery) {
    score += field.weight * 50;
  } else if (text.startsWith(normalizedQuery)) {
    score += field.weight * 24;
  } else if (text.includes(normalizedQuery)) {
    score += field.weight * 16;
  }

  if (compactQuery && compactText && (compactQuery !== normalizedQuery || compactText !== text)) {
    if (compactText === compactQuery) {
      score += field.weight * 50;
    } else if (compactText.startsWith(compactQuery)) {
      score += field.weight * 24;
    } else if (compactText.includes(compactQuery)) {
      score += field.weight * 16;
    }
  }

  for (const token of tokens) {
    if (!token || token === normalizedQuery) {
      continue;
    }

    if (isIdentifierQuery && !/\p{N}/u.test(token)) {
      continue;
    }

    if (text === token) {
      score += field.weight * 12;
    } else if (text.startsWith(token)) {
      score += field.weight * 6;
    } else if (text.includes(token)) {
      score += field.weight * 4;
    }
  }

  return score;
}

const cjkProcurementSegments = [
  '消防员灭火防护服',
  '消防防护服',
  '化学防护服',
  '阻燃防静电服',
  '阻燃防护服',
  '阻燃连体服',
  '防电弧服',
  '水域救援服',
  '焊接防护服',
  '熔融金属飞溅',
  '防静电服',
  '防化服',
  '屏蔽服',
  '阻燃服',
  '连体服',
  '防电弧',
  '阻燃',
  '消防',
  '化学',
  '防化',
  '水域',
  '焊接',
  '防静电',
] as const;

function cjkProcurementTokens(value: string) {
  if (!/[\u3400-\u9fff]/u.test(value)) {
    return [];
  }

  return cjkProcurementSegments.filter((segment) => value.includes(segment) && segment !== value);
}

function procurementIntentTokens(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const suffixes = [
    /(?:厂家|制造商|供应商|工厂|批发|采购|报价)$/u,
    /\s+(?:manufacturer|supplier|factory|vendor|oem|wholesale|procurement|quote)$/iu,
    /^(?:manufacturer|supplier|factory|vendor|oem)\s+/iu,
    /\s+(?:производитель|поставщик)$/iu,
    /^(?:производитель|поставщик)\s+/iu,
  ];
  const variants = suffixes
    .map((suffix) => normalizeSearchText(normalizedQuery.replace(suffix, '')))
    .filter((token) => token && token !== normalizedQuery && token.length >= 2);

  return Array.from(new Set([...variants, ...variants.flatMap(cjkProcurementTokens)]));
}

export function scoreCandidate(candidate: SearchCandidate, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = Array.from(new Set([...tokenizeQuery(query), ...procurementIntentTokens(query)]));

  return candidate.fields.reduce(
    (score, field) => score + scoreField(field, normalizedQuery, tokens),
    0,
  );
}
