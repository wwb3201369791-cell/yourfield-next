import { z } from 'zod';

const localeValues = ['zh', 'en', 'ru'] as const;

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
};

const optionalString = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());
const optionalEmail = z.preprocess(emptyStringToUndefined, z.string().email().optional());

const booleanFlag = z
  .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((value) => value === 'true' || value === '1');

const localeList = z
  .string()
  .default('zh,en,ru')
  .transform((value, context) => {
    const locales = value
      .split(',')
      .map((locale) => locale.trim())
      .filter(Boolean);

    const uniqueLocales = Array.from(new Set(locales));
    const invalidLocales = uniqueLocales.filter(
      (locale) => !localeValues.includes(locale as (typeof localeValues)[number]),
    );
    const missingLocales = localeValues.filter((locale) => !uniqueLocales.includes(locale));

    if (uniqueLocales.length === 0 || invalidLocales.length > 0 || missingLocales.length > 0) {
      context.addIssue({
        code: 'custom',
        message: `NEXT_PUBLIC_LOCALES must contain exactly: ${localeValues.join(',')}`,
      });

      return z.NEVER;
    }

    return uniqueLocales as Array<(typeof localeValues)[number]>;
  });

const envSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(localeValues).default('zh'),
    NEXT_PUBLIC_LOCALES: localeList,
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PAYLOAD_SECRET: z.preprocess(emptyStringToUndefined, z.string().min(32).optional()),
    PAYLOAD_PUBLIC_SERVER_URL: z.string().url().default('http://localhost:3000'),
    PAYLOAD_CONFIG_PATH: z.string().min(1).default('src/payload.config.ts'),
    PAYLOAD_PUBLIC_ADMIN_PATH: z.string().startsWith('/').default('/admin'),

    DATABASE_URI: z
      .string()
      .startsWith('postgresql://')
      .default('postgresql://postgres:password@localhost:5432/yourfield_dev'),
    DATABASE_POOL_MIN: z.coerce.number().int().positive().default(2),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    DATABASE_SLOW_QUERY_MS: z.coerce.number().int().positive().default(500),

    S3_ENDPOINT: optionalUrl,
    S3_REGION: optionalString,
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,
    S3_PUBLIC_URL_BASE: optionalUrl,

    MEILI_HOST: z.string().url().default('http://localhost:7700'),
    MEILI_MASTER_KEY: optionalString,
    MEILI_SEARCH_KEY: optionalString,
    MEILI_INDEX_PREFIX: z.string().min(1).default('yourfield_dev_'),

    UMAMI_WEBSITE_ID: optionalString,
    UMAMI_SCRIPT_URL: optionalUrl,
    UMAMI_API_KEY: optionalString,
    UMAMI_API_URL: optionalUrl,

    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    SMTP_SECURE: booleanFlag.default(false),
    SMTP_FROM: optionalString,
    CONTACT_NOTIFY_TO: z.string().email().default('hnyf@yourfield.net'),
    SUPPORT_REPLY_TO: z.string().email().default('hnyf@yourfield.net'),

    AMAP_KEY: optionalString,
    AMAP_SECURITY_CODE: optionalString,
    GOOGLE_MAPS_KEY: optionalString,
    YANDEX_MAPS_KEY: optionalString,

    TURNSTILE_SITE_KEY: optionalString,
    TURNSTILE_SECRET: optionalString,

    SENTRY_DSN: optionalUrl,
    SENTRY_ORG: optionalString,
    SENTRY_PROJECT: optionalString,
    SENTRY_AUTH_TOKEN: optionalString,
    ALERT_WEBHOOK: optionalUrl,

    NEXT_TELEMETRY_DISABLED: booleanFlag.default(true),
    SKIP_ENV_VALIDATION: booleanFlag.default(false),
    CRON_SECRET: optionalString,
    REVALIDATE_SECRET: optionalString,
    PAYLOAD_PREVIEW_SECRET: optionalString,

    SUPERADMIN_EMAIL: optionalEmail,
    SUPERADMIN_PASSWORD: optionalString,
  })
  .superRefine((data, context) => {
    if (!data.NEXT_PUBLIC_LOCALES.includes(data.NEXT_PUBLIC_DEFAULT_LOCALE)) {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_DEFAULT_LOCALE'],
        message: 'NEXT_PUBLIC_DEFAULT_LOCALE must be listed in NEXT_PUBLIC_LOCALES',
      });
    }
  });

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(envResult.error)}`);
}

export const env = envResult.data;
