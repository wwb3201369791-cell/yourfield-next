import type { SearchHitType } from '@/lib/search/types';

import type { SearchCandidate, WeightedField } from './search-candidates';
import { normalizeSearchText, tokenizeQuery } from './search-text';

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

  for (const token of tokens) {
    if (!token || token === normalizedQuery) {
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

export function scoreCandidate(candidate: SearchCandidate, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeQuery(query);

  return candidate.fields.reduce(
    (score, field) => score + scoreField(field, normalizedQuery, tokens),
    0,
  );
}
