import { z } from 'zod';

import {
  searchHitTypes,
  searchLocales,
  searchRequestTypes,
  type SearchClickParseResult,
  type SearchFieldErrors,
  type SearchParseResult,
  type SearchSuggestParseResult,
} from '@/lib/search/types';

const MAX_QUERY_LENGTH = 80;
const MAX_CATEGORY_LENGTH = 80;
const MAX_PAGE = 1000;
const MAX_HITS_PER_PAGE = 50;
const DEFAULT_HITS_PER_PAGE = 10;
const MAX_SUGGEST_LIMIT = 10;
const DEFAULT_SUGGEST_LIMIT = 6;
const MAX_CLICK_HITS = 100000;
const MAX_CLICK_RESULT_ID_LENGTH = 120;
const MAX_CLICK_RESULT_TITLE_LENGTH = 180;
const MAX_CLICK_RESULT_URL_LENGTH = 300;

const unsafeControlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;

function trimAndCollapse(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

const searchParamsSchema = z.object({
  category: z.preprocess(
    (value) => {
      const normalized = trimAndCollapse(value);

      return normalized || undefined;
    },
    z
      .string()
      .max(MAX_CATEGORY_LENGTH)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
  ),
  hitsPerPage: z.coerce.number().int().min(1).max(MAX_HITS_PER_PAGE).default(DEFAULT_HITS_PER_PAGE),
  locale: z.enum(searchLocales).default('zh'),
  page: z.coerce.number().int().min(1).max(MAX_PAGE).default(1),
  q: z.preprocess(trimAndCollapse, z.string().max(MAX_QUERY_LENGTH)),
  type: z.enum(searchRequestTypes).default('all'),
});

const searchSuggestParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_SUGGEST_LIMIT).default(DEFAULT_SUGGEST_LIMIT),
  locale: z.enum(searchLocales).default('zh'),
  q: z.preprocess(trimAndCollapse, z.string().max(MAX_QUERY_LENGTH)),
});

function isSafeInternalSearchUrl(value: string) {
  return value.startsWith('/') && !value.startsWith('//') && !unsafeControlCharacters.test(value);
}

function safeSearchTextSchema(min: number, max: number) {
  return z
    .string()
    .min(min)
    .max(max)
    .refine((value) => !unsafeControlCharacters.test(value), {
      message: 'Search value contains unsupported control characters.',
    });
}

const searchClickBodySchema = z
  .object({
    hits: z.coerce.number().int().min(0).max(MAX_CLICK_HITS).default(0),
    locale: z.enum(searchLocales),
    query: z.preprocess(trimAndCollapse, safeSearchTextSchema(1, MAX_QUERY_LENGTH)),
    result: z
      .object({
        id: z.preprocess(
          trimAndCollapse,
          safeSearchTextSchema(1, MAX_CLICK_RESULT_ID_LENGTH),
        ),
        title: z.preprocess(
          trimAndCollapse,
          safeSearchTextSchema(1, MAX_CLICK_RESULT_TITLE_LENGTH),
        ),
        type: z.enum(searchHitTypes),
        url: z.preprocess(
          trimAndCollapse,
          z
            .string()
            .min(1)
            .max(MAX_CLICK_RESULT_URL_LENGTH)
            .refine(isSafeInternalSearchUrl, {
              message: 'Result URL must be an internal path.',
            }),
        ),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    const localeRoot = `/${value.locale}`;

    if (value.result.url !== localeRoot && !value.result.url.startsWith(`${localeRoot}/`)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Result URL locale does not match request locale.',
        path: ['result', 'url'],
      });
    }
  });

function fieldErrors(error: z.ZodError): SearchFieldErrors {
  const fields: SearchFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'request';
    fields[field] ??= [];
    fields[field].push(issue.message);
  }

  return fields;
}

function rawParams(searchParams: URLSearchParams) {
  return {
    category: searchParams.get('category') ?? undefined,
    hitsPerPage: searchParams.get('hitsPerPage') ?? searchParams.get('limit') ?? undefined,
    locale: searchParams.get('locale') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    q: searchParams.get('q') ?? '',
    type: searchParams.get('type') ?? undefined,
  };
}

export function parseSearchParams(searchParams: URLSearchParams): SearchParseResult {
  const raw = rawParams(searchParams);

  if (unsafeControlCharacters.test(raw.q)) {
    return {
      error: {
        fields: {
          q: ['Search query contains unsupported control characters.'],
        },
      },
      ok: false,
    };
  }

  const result = searchParamsSchema.safeParse(raw);

  if (!result.success) {
    return {
      error: {
        fields: fieldErrors(result.error),
      },
      ok: false,
    };
  }

  const { category, hitsPerPage, locale, page, q, type } = result.data;

  return {
    ok: true,
    value: {
      ...(category ? { category } : {}),
      hitsPerPage,
      locale,
      page,
      q,
      type,
    },
  };
}

export function parseSearchSuggestParams(searchParams: URLSearchParams): SearchSuggestParseResult {
  const raw = {
    limit: searchParams.get('limit') ?? undefined,
    locale: searchParams.get('locale') ?? undefined,
    q: searchParams.get('q') ?? '',
  };

  if (unsafeControlCharacters.test(raw.q)) {
    return {
      error: {
        fields: {
          q: ['Search query contains unsupported control characters.'],
        },
      },
      ok: false,
    };
  }

  const result = searchSuggestParamsSchema.safeParse(raw);

  if (!result.success) {
    return {
      error: {
        fields: fieldErrors(result.error),
      },
      ok: false,
    };
  }

  return {
    ok: true,
    value: result.data,
  };
}

export function parseSearchClickBody(body: unknown): SearchClickParseResult {
  const result = searchClickBodySchema.safeParse(body);

  if (!result.success) {
    return {
      error: {
        fields: fieldErrors(result.error),
      },
      ok: false,
    };
  }

  return {
    ok: true,
    value: result.data,
  };
}
