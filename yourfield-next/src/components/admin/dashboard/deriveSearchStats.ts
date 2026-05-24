// eslint-disable-next-line no-restricted-imports -- Payload admin webpack does not resolve the Next @ alias.
import {
  compactDisplaySearchTerm,
  isDisplayableOperationalSearchTerm as isDisplayableOperationalSearchTermBase,
} from '../../../lib/search/displayTerms';

import type {
  ApiCollectionResponse,
  SearchLogDocument,
  SearchStatsResponse,
  TopKeyword,
} from './types';

export const isDisplayableOperationalSearchTerm = isDisplayableOperationalSearchTermBase;

export function deriveSearchStats(
  searchLogs: ApiCollectionResponse<SearchLogDocument>,
): SearchStatsResponse {
  const keywords = new Map<
    string,
    { clicks: number; searches: number; zeroResultSearches: number }
  >();
  let totalClicks = 0;
  let totalSearches = 0;
  let zeroResultSearches = 0;

  for (const log of searchLogs.docs ?? []) {
    const query = log.query?.trim() || '未命名关键词';
    const keyword = keywords.get(query) ?? { clicks: 0, searches: 0, zeroResultSearches: 0 };

    if (log.eventType === 'result-click') {
      totalClicks += 1;
      keyword.clicks += 1;
    } else {
      totalSearches += 1;
      keyword.searches += 1;

      if (typeof log.hits === 'number' && log.hits <= 0) {
        zeroResultSearches += 1;
        keyword.zeroResultSearches += 1;
      }
    }

    keywords.set(query, keyword);
  }

  const topKeywords = Array.from(keywords.entries())
    .filter(([, keyword]) => keyword.searches > 0)
    .sort(
      ([leftQuery, left], [rightQuery, right]) =>
        right.searches - left.searches ||
        right.clicks - left.clicks ||
        leftQuery.localeCompare(rightQuery, 'zh-CN'),
    )
    .slice(0, 8)
    .map(([query, keyword]) => ({
      clicks: keyword.clicks,
      query,
      searches: keyword.searches,
      zeroResultSearches: keyword.zeroResultSearches,
    }));

  return {
    ctr: totalSearches > 0 ? totalClicks / totalSearches : 0,
    ok: true,
    topKeywords,
    totalClicks,
    totalSearches,
    zeroResultSearches,
  };
}

export function displayableOperationalTopKeywords(topKeywords: SearchStatsResponse['topKeywords']) {
  const seen = new Set<string>();
  const displayableKeywords: TopKeyword[] = [];

  for (const keyword of topKeywords ?? []) {
    const query = compactDisplaySearchTerm(keyword.query);
    const key = query.toLocaleLowerCase();

    if (!query || !isDisplayableOperationalSearchTermBase(query) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    displayableKeywords.push({
      ...keyword,
      query,
    });
  }

  return displayableKeywords;
}
