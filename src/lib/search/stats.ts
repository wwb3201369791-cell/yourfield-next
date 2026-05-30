import { z } from 'zod';

import { isDisplayableHotSearchTerm } from './displayTerms';
import {
  searchHitTypes,
  searchLocales,
  type SearchFieldErrors,
  type SearchHitType,
  type SearchLocale,
} from './types';

export const searchLogEventTypes = ['search', 'result-click'] as const;
export const searchStatsWindowValues = ['7d', '30d', '90d'] as const;

export type SearchLogEventType = (typeof searchLogEventTypes)[number];
export type SearchStatsWindow = (typeof searchStatsWindowValues)[number];

export const defaultSearchStatsLimit = 100;
export const defaultSearchStatsSourceLimit = 5000;
export const defaultHotSearchSourceLimit = 500;
export const defaultHotSearchWindowDays = 7;

const maxSearchStatsLimit = 100;
const maxSearchStatsSourceLimit = 10000;
const searchStatsWindowDays: Record<SearchStatsWindow, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export type SearchKeywordStats = Readonly<{
  averageHits: number;
  clicks: number;
  ctr: number;
  locale: SearchLocale;
  query: string;
  searches: number;
  zeroResultSearches: number;
}>;

export type SearchStats = Readonly<{
  createdAfter?: string;
  ctr: number;
  generatedAt: string;
  locale?: SearchLocale;
  topKeywords: SearchKeywordStats[];
  totalClicks: number;
  totalSearches: number;
  window?: SearchStatsWindow;
  zeroResultKeywords: SearchKeywordStats[];
  zeroResultSearches: number;
}>;

export type SearchStatsParams = Readonly<{
  createdAfter?: string;
  limit: number;
  locale?: SearchLocale;
  window?: SearchStatsWindow;
}>;

export type SearchStatsParseResult =
  | Readonly<{ ok: true; value: SearchStatsParams }>
  | Readonly<{ error: { fields: SearchFieldErrors }; ok: false }>;

export type SearchLogDocument = Readonly<Record<string, unknown>>;

type SearchLogFindArgs = Readonly<{
  collection: 'search-logs';
  depth: 0;
  limit: number;
  overrideAccess: true;
  sort: string;
  where?: {
    createdAt?: {
      greater_than_equal?: string;
      less_than?: string;
    };
    locale?: {
      equals: SearchLocale;
    };
  };
}>;

type SearchLogsPayload = Readonly<{
  find: (args: SearchLogFindArgs) => Promise<{ docs?: unknown[] }>;
}>;

type KeywordAccumulator = {
  clicks: number;
  locale: SearchLocale;
  query: string;
  searches: number;
  totalHits: number;
  zeroResultSearches: number;
};

const searchStatsParamsSchema = z.object({
  createdAfter: z.preprocess(
    optionalQueryString,
    z
      .string()
      .refine((value) => Number.isFinite(Date.parse(value)), {
        message: 'Invalid ISO date',
      })
      .optional(),
  ),
  limit: z.preprocess(
    firstQueryValue,
    z.coerce.number().int().min(1).max(maxSearchStatsLimit).default(defaultSearchStatsLimit),
  ),
  locale: z.preprocess(optionalQueryString, z.enum(searchLocales).optional()),
  window: z.preprocess(optionalQueryString, z.enum(searchStatsWindowValues).optional()),
});

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? (value as unknown[])[0] : value;
}

function optionalQueryString(value: unknown) {
  const first = firstQueryValue(value);

  return typeof first === 'string' && first.trim() ? first.trim() : undefined;
}

function fieldErrors(error: z.ZodError): SearchFieldErrors {
  const fields: SearchFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'request';
    fields[field] ??= [];
    fields[field].push(issue.message);
  }

  return fields;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSearchLocale(value: unknown): value is SearchLocale {
  return typeof value === 'string' && searchLocales.includes(value as SearchLocale);
}

function isSearchHitType(value: unknown): value is SearchHitType {
  return typeof value === 'string' && searchHitTypes.includes(value as SearchHitType);
}

function compactSearchTerm(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function readNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function readEventType(value: unknown): SearchLogEventType {
  return value === 'result-click' ? 'result-click' : 'search';
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0;
}

function keywordKey(locale: SearchLocale, query: string) {
  return `${locale}\u0000${query.toLocaleLowerCase()}`;
}

function searchWindowStartIso(windowDays: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (windowDays - 1));

  return date.toISOString();
}

function hotSearchWindowStartIso(windowDays: number) {
  return searchWindowStartIso(windowDays);
}

function searchStatsWindowStartIso(window: SearchStatsWindow) {
  return searchWindowStartIso(searchStatsWindowDays[window]);
}

function keywordStatsFromAccumulator(accumulator: KeywordAccumulator): SearchKeywordStats {
  return {
    averageHits:
      accumulator.searches > 0
        ? Number((accumulator.totalHits / accumulator.searches).toFixed(2))
        : 0,
    clicks: accumulator.clicks,
    ctr: ratio(accumulator.clicks, accumulator.searches),
    locale: accumulator.locale,
    query: accumulator.query,
    searches: accumulator.searches,
    zeroResultSearches: accumulator.zeroResultSearches,
  };
}

function sortTopKeywords(left: SearchKeywordStats, right: SearchKeywordStats) {
  if (right.searches !== left.searches) {
    return right.searches - left.searches;
  }

  if (right.clicks !== left.clicks) {
    return right.clicks - left.clicks;
  }

  return left.query.localeCompare(right.query);
}

function sortZeroResultKeywords(left: SearchKeywordStats, right: SearchKeywordStats) {
  if (right.zeroResultSearches !== left.zeroResultSearches) {
    return right.zeroResultSearches - left.zeroResultSearches;
  }

  return sortTopKeywords(left, right);
}

export function parseSearchStatsParams(query: unknown): SearchStatsParseResult {
  const result = searchStatsParamsSchema.safeParse(isRecord(query) ? query : {});

  if (!result.success) {
    return {
      error: {
        fields: fieldErrors(result.error),
      },
      ok: false,
    };
  }

  const { createdAfter, limit, locale, window } = result.data;
  const effectiveCreatedAfter =
    createdAfter ?? (window ? searchStatsWindowStartIso(window) : undefined);

  return {
    ok: true,
    value: {
      ...(effectiveCreatedAfter ? { createdAfter: effectiveCreatedAfter } : {}),
      ...(locale ? { locale } : {}),
      limit,
      ...(window ? { window } : {}),
    },
  };
}

export function isSearchLogsSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /(?:relation|table)\s+"?search_logs"?\s+does not exist/iu.test(message);
}

export function summarizeSearchLogs(
  logs: readonly SearchLogDocument[],
  params: SearchStatsParams,
): SearchStats {
  const accumulators = new Map<string, KeywordAccumulator>();
  const createdAfterTime = params.createdAfter ? Date.parse(params.createdAfter) : Number.NaN;
  let totalClicks = 0;
  let totalSearches = 0;
  let zeroResultSearches = 0;

  for (const log of logs) {
    if (Number.isFinite(createdAfterTime)) {
      const rawCreatedAt = log.createdAt;
      const createdAtTime =
        typeof rawCreatedAt === 'string' || typeof rawCreatedAt === 'number'
          ? Date.parse(String(rawCreatedAt))
          : Number.NaN;
      if (!Number.isFinite(createdAtTime) || createdAtTime < createdAfterTime) {
        continue;
      }
    }

    const locale = log.locale;
    if (!isSearchLocale(locale) || (params.locale && locale !== params.locale)) {
      continue;
    }

    const query = compactSearchTerm(log.query);
    if (!query) {
      continue;
    }

    if (log.resultType != null && !isSearchHitType(log.resultType)) {
      continue;
    }

    const key = keywordKey(locale, query);
    const existing = accumulators.get(key);
    const accumulator =
      existing ??
      ({
        clicks: 0,
        locale,
        query,
        searches: 0,
        totalHits: 0,
        zeroResultSearches: 0,
      } satisfies KeywordAccumulator);

    if (!existing) {
      accumulators.set(key, accumulator);
    }

    const eventType = readEventType(log.eventType);
    if (eventType === 'result-click') {
      accumulator.clicks += 1;
      totalClicks += 1;
      continue;
    }

    const hits = readNumber(log.hits);
    accumulator.searches += 1;
    accumulator.totalHits += hits;
    totalSearches += 1;

    if (hits === 0) {
      accumulator.zeroResultSearches += 1;
      zeroResultSearches += 1;
    }
  }

  const keywordStats = [...accumulators.values()].map(keywordStatsFromAccumulator);

  return {
    ...(params.createdAfter ? { createdAfter: params.createdAfter } : {}),
    ...(params.locale ? { locale: params.locale } : {}),
    ctr: ratio(totalClicks, totalSearches),
    generatedAt: new Date().toISOString(),
    topKeywords: keywordStats
      .filter((item) => item.searches > 0)
      .sort(sortTopKeywords)
      .slice(0, params.limit),
    totalClicks,
    totalSearches,
    ...(params.window ? { window: params.window } : {}),
    zeroResultKeywords: keywordStats
      .filter((item) => item.zeroResultSearches > 0)
      .sort(sortZeroResultKeywords)
      .slice(0, params.limit),
    zeroResultSearches,
  };
}

export function hotTermsFromSearchLogs(
  logs: readonly SearchLogDocument[],
  params: Readonly<{
    fallbackTerms: readonly string[];
    limit: number;
    locale: SearchLocale;
  }>,
) {
  const stats = summarizeSearchLogs(logs, { limit: params.limit, locale: params.locale });
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const item of stats.topKeywords) {
    const key = item.query.toLocaleLowerCase();
    if (isDisplayableHotSearchTerm(item.query, { locale: params.locale }) && !seen.has(key)) {
      seen.add(key);
      terms.push(item.query);
    }
  }

  for (const term of params.fallbackTerms) {
    const normalized = compactSearchTerm(term);
    const key = normalized.toLocaleLowerCase();
    if (isDisplayableHotSearchTerm(normalized, { locale: params.locale }) && !seen.has(key)) {
      seen.add(key);
      terms.push(normalized);
    }

    if (terms.length >= params.limit) {
      break;
    }
  }

  return terms.slice(0, params.limit);
}

export async function findSearchLogDocuments(
  payload: SearchLogsPayload,
  options: Readonly<{
    createdAfter?: string;
    limit?: number;
    locale?: SearchLocale;
  }>,
) {
  const limit = Math.min(
    Math.max(options.limit ?? defaultSearchStatsSourceLimit, 1),
    maxSearchStatsSourceLimit,
  );
  const where = {
    ...(options.createdAfter
      ? {
          createdAt: {
            greater_than_equal: options.createdAfter,
          },
        }
      : {}),
    ...(options.locale
      ? {
          locale: {
            equals: options.locale,
          },
        }
      : {}),
  } satisfies NonNullable<SearchLogFindArgs['where']>;
  const findArgs: SearchLogFindArgs = {
    collection: 'search-logs',
    depth: 0,
    limit,
    overrideAccess: true,
    sort: '-createdAt',
    ...(Object.keys(where).length > 0 ? { where } : {}),
  };

  try {
    const result = await payload.find(findArgs);

    return Array.isArray(result.docs) ? (result.docs as SearchLogDocument[]) : [];
  } catch (error) {
    if (isSearchLogsSchemaError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getSearchStatsFromPayload(
  payload: SearchLogsPayload,
  params: SearchStatsParams,
) {
  const logs = await findSearchLogDocuments(payload, {
    ...(params.createdAfter ? { createdAfter: params.createdAfter } : {}),
    ...(params.locale ? { locale: params.locale } : {}),
    limit: defaultSearchStatsSourceLimit,
  });

  return summarizeSearchLogs(logs, params);
}

export async function getHotSearchTermsFromPayload(
  payload: SearchLogsPayload,
  params: Readonly<{
    fallbackTerms: readonly string[];
    limit: number;
    locale: SearchLocale;
  }>,
) {
  const logs = await findSearchLogDocuments(payload, {
    createdAfter: hotSearchWindowStartIso(defaultHotSearchWindowDays),
    limit: defaultHotSearchSourceLimit,
    locale: params.locale,
  });

  return hotTermsFromSearchLogs(logs, params);
}
