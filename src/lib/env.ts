import { z } from 'zod';

const localeValues = ['zh', 'en', 'ru'] as const;
const adminLocaleValues = ['zh', 'en'] as const;

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
};

const optionalString = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());
const optionalEmail = z.preprocess(emptyStringToUndefined, z.string().email().optional());
const turnstileTestSiteKeys = new Set([
  '1x00000000000000000000AA',
  '2x00000000000000000000AB',
  '1x00000000000000000000BB',
  '2x00000000000000000000BB',
  '3x00000000000000000000FF',
]);
const turnstileTestSecretKeys = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

function normalizedSecretLike(value: string | undefined) {
  const trimmed = value?.trim();
  const firstChar = trimmed?.[0];
  const lastChar = trimmed?.[trimmed.length - 1];

  return trimmed &&
    trimmed.length >= 2 &&
    (firstChar === '"' || firstChar === "'") &&
    firstChar === lastChar
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

const s3StorageRequiredEnvKeys = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

const productionRequiredSecretKeys = [
  'CRON_SECRET',
  'REVALIDATE_SECRET',
  'PAYLOAD_PREVIEW_SECRET',
] as const;

const booleanFlag = z
  .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((value) => value === 'true' || value === '1');

const positiveIntegerWithDefault = (defaultValue: number) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional().default(defaultValue),
  );

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
    APP_VERSION: z.string().min(1).default('0.0.0-local'),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
    NEXT_PHASE: optionalString,
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PAYLOAD_SECRET: z.preprocess(emptyStringToUndefined, z.string().min(32).optional()),
    PAYLOAD_PUBLIC_SERVER_URL: z.string().url().default('http://localhost:3000'),
    PAYLOAD_CONFIG_PATH: z.string().min(1).default('src/payload.config.ts'),
    PAYLOAD_PUBLIC_ADMIN_PATH: z.string().startsWith('/').default('/admin'),
    PAYLOAD_ADMIN_LOCALE: z.enum(adminLocaleValues).default('zh'),
    PAYLOAD_PUBLIC_API_PATH: z.string().startsWith('/').default('/payload-api'),
    PAYLOAD_PUBLIC_GRAPHQL_PATH: z.string().startsWith('/').default('/payload-graphql'),
    PAYLOAD_PUBLIC_GRAPHQL_PLAYGROUND_PATH: z
      .string()
      .startsWith('/')
      .default('/payload-graphql-playground'),
    PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER: optionalString,
    PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD: optionalString,
    PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST: optionalString,
    PAYLOAD_PRIVATE_ROUTES_REQUIRE_IP_ALLOWLIST: booleanFlag.default(false),
    PAYLOAD_PRIVATE_ROUTES_TRUST_PROXY_HEADERS: booleanFlag.default(false),
    PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION: booleanFlag.default(false),
    PAYLOAD_DB_PUSH: booleanFlag.default(false),
    STRICT_I18N_PUBLISH: booleanFlag.default(true),
    PORT: z.coerce.number().int().positive().default(3000),
    COOKIE_DOMAIN: optionalString,

    DATABASE_URI: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .startsWith('postgresql://')
        .optional()
        .default('postgresql://postgres@localhost:5432/yourfield_dev'),
    ),
    DATABASE_POOL_MIN: z.coerce.number().int().nonnegative().default(0),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    DATABASE_SLOW_QUERY_MS: z.coerce.number().int().positive().default(500),

    S3_ENDPOINT: optionalUrl,
    S3_REGION: optionalString,
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,
    S3_PUBLIC_URL_BASE: optionalUrl,

    MEDIA_UPLOAD_IMAGE_MAX_BYTES: positiveIntegerWithDefault(10 * 1024 * 1024),
    MEDIA_UPLOAD_PDF_MAX_BYTES: positiveIntegerWithDefault(20 * 1024 * 1024),
    MEDIA_UPLOAD_VIDEO_MAX_BYTES: positiveIntegerWithDefault(100 * 1024 * 1024),

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
    CONTACT_NOTIFY_TO: optionalEmail,
    SUPPORT_REPLY_TO: optionalEmail,

    AMAP_KEY: optionalString,
    AMAP_SECURITY_CODE: optionalString,
    GOOGLE_MAPS_KEY: optionalString,
    YANDEX_MAPS_KEY: optionalString,

    TURNSTILE_SECRET: optionalString,
    CONTACT_FORM_TRUST_PROXY_HEADERS: booleanFlag.default(false),

    SENTRY_DSN: optionalUrl,
    SENTRY_ORG: optionalString,
    SENTRY_PROJECT: optionalString,
    SENTRY_AUTH_TOKEN: optionalString,
    ALERT_WEBHOOK: optionalUrl,

    NEXT_TELEMETRY_DISABLED: booleanFlag.default(true),
    SKIP_ENV_VALIDATION: booleanFlag.default(false),
    PAYLOAD_SEED_MODE: booleanFlag.default(false),
    CRON_SECRET: optionalString,
    REVALIDATE_SECRET: optionalString,
    PAYLOAD_PREVIEW_SECRET: optionalString,

    SUPERADMIN_EMAIL: optionalEmail,
    SUPERADMIN_PASSWORD: optionalString,
    SUPERADMIN_USERNAME: optionalString,
  })
  .superRefine((data, context) => {
    if (!data.NEXT_PUBLIC_LOCALES.includes(data.NEXT_PUBLIC_DEFAULT_LOCALE)) {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_DEFAULT_LOCALE'],
        message: 'NEXT_PUBLIC_DEFAULT_LOCALE must be listed in NEXT_PUBLIC_LOCALES',
      });
    }

    const hasTurnstileSiteKey = Boolean(data.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    const hasTurnstileSecret = Boolean(data.TURNSTILE_SECRET);

    if (hasTurnstileSecret && !hasTurnstileSiteKey) {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_TURNSTILE_SITE_KEY'],
        message: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY is required when TURNSTILE_SECRET is configured',
      });
    }

    if (hasTurnstileSiteKey && !hasTurnstileSecret) {
      context.addIssue({
        code: 'custom',
        path: ['TURNSTILE_SECRET'],
        message: 'TURNSTILE_SECRET is required when NEXT_PUBLIC_TURNSTILE_SITE_KEY is configured',
      });
    }

    const shouldRequireProductionRuntimeSecrets =
      data.NODE_ENV === 'production' && !data.SKIP_ENV_VALIDATION;

    if (
      shouldRequireProductionRuntimeSecrets &&
      turnstileTestSiteKeys.has(normalizedSecretLike(data.NEXT_PUBLIC_TURNSTILE_SITE_KEY) ?? '')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_TURNSTILE_SITE_KEY'],
        message:
          'NEXT_PUBLIC_TURNSTILE_SITE_KEY must not use a Cloudflare Turnstile test site key in production',
      });
    }

    if (
      shouldRequireProductionRuntimeSecrets &&
      turnstileTestSecretKeys.has(normalizedSecretLike(data.TURNSTILE_SECRET) ?? '')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['TURNSTILE_SECRET'],
        message:
          'TURNSTILE_SECRET must not use a Cloudflare Turnstile test secret key in production',
      });
    }

    if (data.NODE_ENV === 'production' && !data.PAYLOAD_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['PAYLOAD_SECRET'],
        message: 'PAYLOAD_SECRET is required in production',
      });
    }

    if (shouldRequireProductionRuntimeSecrets && !process.env.DATABASE_URI?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URI'],
        message: 'DATABASE_URI is required in production',
      });
    }

    if (shouldRequireProductionRuntimeSecrets) {
      productionRequiredSecretKeys.forEach((key) => {
        if (!data[key]) {
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `${key} is required in production`,
          });
        }
      });
    }

    const hasBasicAuth =
      Boolean(data.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER) ||
      Boolean(data.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD);

    if (hasBasicAuth) {
      if (!data.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER) {
        context.addIssue({
          code: 'custom',
          path: ['PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER'],
          message:
            'PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER is required when Payload private route Basic Auth is configured',
        });
      }

      if (!data.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD) {
        context.addIssue({
          code: 'custom',
          path: ['PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD'],
          message:
            'PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD is required when Payload private route Basic Auth is configured',
        });
      }
    }

    if (
      data.PAYLOAD_PRIVATE_ROUTES_REQUIRE_IP_ALLOWLIST &&
      !data.PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST
    ) {
      context.addIssue({
        code: 'custom',
        path: ['PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST'],
        message:
          'PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST is required when PAYLOAD_PRIVATE_ROUTES_REQUIRE_IP_ALLOWLIST=true',
      });
    }

    if (shouldRequireProductionRuntimeSecrets) {
      const hasPayloadPrivateRouteProtection =
        (data.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER &&
          data.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD) ||
        data.PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST ||
        data.PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION;

      if (!hasPayloadPrivateRouteProtection) {
        context.addIssue({
          code: 'custom',
          path: ['PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER'],
          message:
            'Production must protect /admin and Payload API routes with Basic Auth, IP allowlist, or PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION=true when a reverse proxy/VPN already protects them',
        });
      }
    }

    const missingS3Keys = s3StorageRequiredEnvKeys.filter((key) => data[key] === undefined);

    if (missingS3Keys.length > 0 && missingS3Keys.length < s3StorageRequiredEnvKeys.length) {
      context.addIssue({
        code: 'custom',
        path: ['S3_ENDPOINT'],
        message: `S3 object storage env must be fully configured or left fully empty. Missing: ${missingS3Keys.join(', ')}`,
      });
    }
  });

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(envResult.error)}`);
}

export const env = envResult.data;
