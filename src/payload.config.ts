import path from 'path';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { AuditLogs } from './collections/AuditLogs';
import { FAQs } from './collections/FAQs';
import { FormSubmissions } from './collections/FormSubmissions';
import { Media } from './collections/Media';
import { News } from './collections/News';
import { Pages } from './collections/Pages';
import { ProductCategories } from './collections/ProductCategories';
import { ProductGroups } from './collections/ProductGroups';
import { Products } from './collections/Products';
import { Roles } from './collections/Roles';
import { SearchLogs } from './collections/SearchLogs';
import { Solutions } from './collections/Solutions';
import { Users } from './collections/Users';
import { Navigation } from './globals/Navigation';
import { SiteSettings } from './globals/SiteSettings';
import { env } from './lib/env';
import { maxConfiguredMediaUploadBytes } from './lib/media/uploadLimits';
import { adminI18nResources, adminSupportedLanguages } from './lib/payload/adminI18nResources';
import { createDashboardHealthEndpoint } from './lib/payload/dashboardHealthEndpoint';
import { resolvePayloadDatabasePoolMax } from './lib/payload/databasePool';
import { getPayloadSecret } from './lib/payload/secret';
import { createPayloadCloudStoragePlugin } from './lib/payload/storage';

const isProductionBuild = env.NEXT_PHASE === 'phase-production-build';
const allowDatabasePush = env.NODE_ENV !== 'production' && env.PAYLOAD_DB_PUSH;
const databasePoolMin = isProductionBuild ? 0 : env.DATABASE_POOL_MIN;
const databasePoolMax = resolvePayloadDatabasePoolMax(env.DATABASE_POOL_MAX, {
  isProductionBuild,
});

function payloadServerURL() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return env.PAYLOAD_PUBLIC_SERVER_URL;
}

export default buildConfig({
  serverURL: payloadServerURL(),
  secret: getPayloadSecret(env),
  routes: {
    admin: env.PAYLOAD_PUBLIC_ADMIN_PATH,
    api: env.PAYLOAD_PUBLIC_API_PATH,
    graphQL: env.PAYLOAD_PUBLIC_GRAPHQL_PATH,
    graphQLPlayground: env.PAYLOAD_PUBLIC_GRAPHQL_PLAYGROUND_PATH,
  },
  endpoints: [createDashboardHealthEndpoint(env.PAYLOAD_PUBLIC_ADMIN_PATH)],
  admin: {
    user: Users.slug,
    dateFormat: 'yyyy年MM月dd日 HH:mm',
    components: {
      actions: ['@/components/admin/AdminInterfaceLanguageSwitch#AdminInterfaceLanguageSwitch'],
      afterLogin: ['@/components/admin/AdminBrand#AdminLoginSupport'],
      beforeDashboard: [
        '@/components/admin/AdminBrand#AdminDashboardIntro',
        {
          path: '@/components/admin/AdminOperationsDashboard#AdminOperationsDashboard',
          clientProps: {
            adminBase: env.PAYLOAD_PUBLIC_ADMIN_PATH,
            apiBase: env.PAYLOAD_PUBLIC_API_PATH,
          },
        },
      ],
      beforeLogin: ['@/components/admin/AdminBrand#AdminLoginIntro'],
      beforeNavLinks: [
        '@/components/admin/AdminContentLocaleReset#AdminContentLocaleReset',
        '@/components/admin/AdminNavLocalizationSync#AdminNavLocalizationSync',
        '@/components/admin/AdminBrand#AdminNavBrand',
      ],
      graphics: {
        Icon: '@/components/admin/AdminBrand#YourfieldAdminIcon',
        Logo: '@/components/admin/AdminBrand#YourfieldAdminLogo',
      },
      logout: {
        Button: '@/components/admin/AdminBrand#AdminLogoutButton',
      },
      views: {
        Health: {
          Component: '@/components/admin/AdminDashboardHealthView#AdminDashboardHealthView',
          path: '/health',
        },
      },
    },
    meta: {
      icons: {
        icon: '/favicon.png',
      },
      openGraph: {
        images: ['/images/brand/yourfield-logo-official-b.png'],
      },
      titleSuffix: ' - 永霏网站后台',
    },
  },
  i18n: {
    fallbackLanguage: env.PAYLOAD_ADMIN_LOCALE,
    supportedLanguages: adminSupportedLanguages,
    translations: adminI18nResources,
  },
  db: postgresAdapter({
    push: allowDatabasePush,
    pool: {
      ...(isProductionBuild ? { allowExitOnIdle: true, idleTimeoutMillis: 1000 } : {}),
      connectionString: env.DATABASE_URI,
      connectionTimeoutMillis: 5000,
      min: databasePoolMin,
      max: databasePoolMax,
    },
  }),
  editor: lexicalEditor({}),
  localization: {
    locales: [
      { label: '简体中文', code: 'zh', fallbackLocale: 'en' },
      { label: 'English', code: 'en', fallbackLocale: 'zh' },
      { label: 'Русский', code: 'ru', fallbackLocale: 'en' },
    ],
    defaultLocale: env.NEXT_PUBLIC_DEFAULT_LOCALE,
    fallback: true,
  },
  collections: [
    FormSubmissions,
    ProductGroups,
    ProductCategories,
    Products,
    Solutions,
    News,
    Pages,
    FAQs,
    Media,
    SearchLogs,
    Users,
    Roles,
    AuditLogs,
  ],
  globals: [Navigation, SiteSettings],
  plugins: [createPayloadCloudStoragePlugin()],
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: maxConfiguredMediaUploadBytes,
    },
    responseOnLimit: 'Uploaded file exceeds the configured media size limit.',
  },
  cors: [env.NEXT_PUBLIC_SITE_URL, env.PAYLOAD_PUBLIC_SERVER_URL],
  csrf: [env.NEXT_PUBLIC_SITE_URL, env.PAYLOAD_PUBLIC_SERVER_URL],
  graphQL: {
    disablePlaygroundInProduction: true,
    schemaOutputFile: path.resolve(process.cwd(), 'src/payload-generated-schema.graphql'),
  },
  typescript: {
    declare: false,
    outputFile: path.resolve(process.cwd(), 'src/payload-types.ts'),
  },
  telemetry: false,
  sharp,
});
