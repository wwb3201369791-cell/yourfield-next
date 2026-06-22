import type { SearchCandidate } from './search-candidates';
import { normalizeSearchText, tokenizeQuery, truncate } from './search-text';

export function snippetFor(candidate: SearchCandidate, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeQuery(query);
  const match = candidate.fields.find((field) => {
    if (field.snippet === false) {
      return false;
    }

    const text = normalizeSearchText(field.text);

    return text.includes(normalizedQuery) || tokens.some((token) => token && text.includes(token));
  });

  return truncate(match?.text || candidate.excerpt || candidate.title);
}
