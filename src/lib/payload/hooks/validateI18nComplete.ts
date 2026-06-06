import {
  APIError,
  type CollectionBeforeChangeHook,
  type Field,
  type GlobalBeforeChangeHook,
} from 'payload';

import { env } from '../../env';
import {
  collectCheckSpecs,
  collectMissingFields,
  docsByLocale,
  filterSpecs,
  formatMissingMessage,
  hasMissingFields,
  isRecord,
  type LocaleCode,
  type MissingByLocale,
  type RequiredI18nPath,
} from '../../i18n/i18nCompleteness';

type PublishStatusRule =
  | Readonly<{
      mode?: 'draftStatus';
      field?: string;
    }>
  | Readonly<{
      mode: 'booleanStatus';
      field: string;
    }>
  | Readonly<{
      mode: 'always';
    }>;

type RequireAllLocalesOptions = Readonly<{
  paths?: readonly (string | RequiredI18nPath)[];
  status?: PublishStatusRule;
}>;

function shouldValidateForStatus(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  status: PublishStatusRule | undefined,
) {
  const rule = status ?? { mode: 'draftStatus' as const, field: '_status' };

  if (rule.mode === 'always') {
    return data._status !== 'draft';
  }

  const field = rule.field ?? '_status';
  const nextValue = data[field] ?? originalDoc?.[field];

  if (rule.mode === 'booleanStatus') {
    return nextValue === true;
  }

  return nextValue === 'published';
}

function currentLocaleFromReq(
  req: { locale?: unknown; payload?: { config?: { localization?: unknown } } },
  locales: readonly LocaleCode[],
) {
  if (typeof req.locale === 'string') {
    return req.locale;
  }

  const localization = req.payload?.config?.localization;
  const defaultLocale = isRecord(localization) ? localization.defaultLocale : undefined;

  if (typeof defaultLocale === 'string') {
    return defaultLocale;
  }

  return locales[0] ?? 'en';
}

async function findExistingCollectionAllLocales(args: {
  collection: string;
  id: number | string | undefined;
  req: {
    payload?: {
      findByID?: unknown;
    };
  };
}) {
  const findByID = args.req.payload?.findByID;

  if (!args.id || typeof findByID !== 'function') {
    return undefined;
  }

  return (findByID as (options: Record<string, unknown>) => Promise<unknown>)({
    collection: args.collection,
    id: args.id,
    locale: 'all',
    draft: true,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    req: args.req,
  });
}

async function findExistingGlobalAllLocales(args: {
  req: {
    payload?: {
      findGlobal?: unknown;
    };
  };
  slug: string;
}) {
  const findGlobal = args.req.payload?.findGlobal;

  if (typeof findGlobal !== 'function') {
    return undefined;
  }

  return (findGlobal as (options: Record<string, unknown>) => Promise<unknown>)({
    slug: args.slug,
    locale: 'all',
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    req: args.req,
  });
}

function shouldSkipCompletenessValidation() {
  return env.PAYLOAD_SEED_MODE;
}

function handleMissing(
  message: string,
  missing: MissingByLocale,
  req: { payload?: { logger?: { warn?: (message: unknown) => void } } },
) {
  const details = Object.fromEntries(
    Array.from(missing.entries()).map(([locale, fields]) => [locale, Array.from(fields)]),
  );

  if (!env.STRICT_I18N_PUBLISH) {
    console.warn(message);
    req.payload?.logger?.warn?.({
      missing: details,
      msg: 'I18n publish completeness warning',
    });
    return;
  }

  throw new APIError(message, 400, { code: 'I18N_INCOMPLETE', missing: details }, true);
}

function documentID(originalDoc: Record<string, unknown> | undefined) {
  const id = originalDoc?.id ?? originalDoc?._id;
  return typeof id === 'string' || typeof id === 'number' ? id : undefined;
}

export function requireAllLocalesOnPublish(
  locales: readonly LocaleCode[],
  options: RequireAllLocalesOptions = {},
): CollectionBeforeChangeHook {
  return async ({ collection, data, originalDoc, req }) => {
    const incomingData = data as Record<string, unknown>;
    const original = originalDoc as Record<string, unknown> | undefined;

    if (
      shouldSkipCompletenessValidation() ||
      !shouldValidateForStatus(incomingData, original, options.status)
    ) {
      return incomingData;
    }

    const fields = collection.fields as readonly Field[];
    const specs = filterSpecs(collectCheckSpecs(fields), options.paths);
    const existingAllLocales = (await findExistingCollectionAllLocales({
      collection: collection.slug,
      id: documentID(original),
      req,
    })) as Record<string, unknown> | undefined;
    const missing = collectMissingFields(
      docsByLocale({
        currentLocale: currentLocaleFromReq(req, locales),
        data: incomingData,
        existingAllLocales,
        fields,
        locales,
      }),
      specs,
    );

    if (hasMissingFields(missing)) {
      handleMissing(formatMissingMessage(missing), missing, req);
    }

    return incomingData;
  };
}

export function requireAllLocalesOnGlobalSave(
  locales: readonly LocaleCode[],
  options: Omit<RequireAllLocalesOptions, 'status'> = {},
): GlobalBeforeChangeHook {
  return async ({ data, global, req }) => {
    const incomingData = data as Record<string, unknown>;
    if (shouldSkipCompletenessValidation()) {
      return incomingData;
    }

    const fields = global.fields as readonly Field[];
    const specs = filterSpecs(collectCheckSpecs(fields), options.paths);
    const existingAllLocales = (await findExistingGlobalAllLocales({
      req,
      slug: global.slug,
    })) as Record<string, unknown> | undefined;
    const missing = collectMissingFields(
      docsByLocale({
        currentLocale: currentLocaleFromReq(req, locales),
        data: incomingData,
        existingAllLocales,
        fields,
        locales,
      }),
      specs,
    );

    if (hasMissingFields(missing)) {
      handleMissing(formatMissingMessage(missing), missing, req);
    }

    return incomingData;
  };
}
