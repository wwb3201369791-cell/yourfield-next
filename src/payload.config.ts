import path from 'path';

import { webpackBundler } from '@payloadcms/bundler-webpack';
import { postgresAdapter } from '@payloadcms/db-postgres';
import type {
  Args as PostgresAdapterArgs,
  PostgresAdapter,
  PostgresAdapterResult,
} from '@payloadcms/db-postgres/dist/types';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload/config';
import type { PayloadBundler } from 'payload/dist/bundlers/types';
import { createElement } from 'react';

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
import {
  AdminDashboardIntro,
  AdminLoginIntro,
  AdminLoginSupport,
  AdminLogoutButton,
  AdminNavBrand,
  YourfieldAdminIcon,
  YourfieldAdminLogo,
} from './components/admin/AdminBrand';
import { AdminDashboardHealthView } from './components/admin/AdminDashboardHealthView';
import { AdminOperationsDashboard } from './components/admin/AdminOperationsDashboard';
import { Navigation } from './globals/Navigation';
import { SiteSettings } from './globals/SiteSettings';
import { env } from './lib/env';
import { maxConfiguredMediaUploadBytes } from './lib/media/uploadLimits';
import { adminI18nResources } from './lib/payload/adminI18nResources';
import { createDashboardHealthEndpoint } from './lib/payload/dashboardHealthEndpoint';
import { localizeLexicalFeatures } from './lib/payload/localizeLexicalEditor';
import { createPayloadCloudStoragePlugin } from './lib/payload/storage';

const bundler = webpackBundler() as PayloadBundler;
const isProductionBuild = env.NEXT_PHASE === 'phase-production-build';
const allowDatabasePush = env.NODE_ENV !== 'production' && env.PAYLOAD_DB_PUSH;
const databasePoolMin = isProductionBuild ? 0 : env.DATABASE_POOL_MIN;
const databasePoolMax = isProductionBuild
  ? Math.min(env.DATABASE_POOL_MAX, 2)
  : env.DATABASE_POOL_MAX;
const createPostgresAdapter = allowDatabasePush ? postgresAdapter : createNonPushingPostgresAdapter;

function AdminOperationsDashboardWithRoutes() {
  return createElement(AdminOperationsDashboard, {
    adminBase: env.PAYLOAD_PUBLIC_ADMIN_PATH,
    apiBase: env.PAYLOAD_PUBLIC_API_PATH,
  });
}

function payloadServerURL() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return env.PAYLOAD_PUBLIC_SERVER_URL;
}

type PayloadLogger = {
  warn: (message: string) => void;
};

type ReleasablePoolClient = {
  release?: () => void;
};

type PoolWithInternalClients = {
  _clients?: unknown;
};

function releasePinnedPoolClients(pool: unknown, logger: PayloadLogger) {
  const clients = (pool as PoolWithInternalClients | undefined)?._clients;
  if (!Array.isArray(clients)) {
    return;
  }

  for (const client of clients) {
    const poolClient = client as ReleasablePoolClient;
    if (typeof poolClient.release !== 'function') {
      continue;
    }

    try {
      poolClient.release();
    } catch (error) {
      logger.warn(
        `Postgres pool client release skipped: ${
          error instanceof Error ? error.message : 'Unknown release error'
        }`,
      );
    }
  }
}

function createNonPushingPostgresAdapter(args: PostgresAdapterArgs): PostgresAdapterResult {
  const baseAdapter = postgresAdapter({ ...args, push: false });

  return ({ payload }) => {
    const adapter = baseAdapter({ payload });
    const originalConnect = adapter.connect?.bind(adapter);

    if (!originalConnect) {
      throw new Error('Postgres adapter connect function is unavailable.');
    }

    adapter.connect = async function connectWithoutPinnedClient(
      this: PostgresAdapter,
      currentPayload,
    ) {
      await originalConnect(currentPayload);
      releasePinnedPoolClients(adapter.pool, currentPayload.logger);
    };

    return adapter;
  };
}

export default buildConfig({
  serverURL: payloadServerURL(),
  routes: {
    admin: env.PAYLOAD_PUBLIC_ADMIN_PATH,
    api: env.PAYLOAD_PUBLIC_API_PATH,
    graphQL: env.PAYLOAD_PUBLIC_GRAPHQL_PATH,
    graphQLPlayground: env.PAYLOAD_PUBLIC_GRAPHQL_PLAYGROUND_PATH,
  },
  endpoints: [createDashboardHealthEndpoint(env.PAYLOAD_PUBLIC_ADMIN_PATH)],
  admin: {
    user: Users.slug,
    bundler,
    dateFormat: 'yyyy年MM月dd日 HH:mm',
    components: {
      afterLogin: [AdminLoginSupport],
      beforeDashboard: [AdminDashboardIntro, AdminOperationsDashboardWithRoutes],
      beforeLogin: [AdminLoginIntro],
      beforeNavLinks: [AdminNavBrand],
      graphics: {
        Icon: YourfieldAdminIcon,
        Logo: YourfieldAdminLogo,
      },
      logout: {
        Button: AdminLogoutButton,
      },
      views: {
        Health: {
          Component: AdminDashboardHealthView,
          path: '/health',
        },
      },
    },
    css: path.resolve(process.cwd(), 'src/styles/payload-admin.css'),
    meta: {
      favicon: '/favicon.png',
      ogImage: '/images/brand/yourfield-logo-official-b.png',
      titleSuffix: ' - 永霏网站后台',
    },
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    webpack: (config) => {
      const webpack = eval('require')('webpack');
      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            '@': path.resolve(process.cwd(), 'src'),
            crypto: false,
            webpack: false,
          },
        },
        plugins: [
          ...(config.plugins || []),
          new webpack.ProvidePlugin({
            React: 'react',
          }),
          new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
            resource.request = resource.request.replace(/^node:/, '');
          }),
        ],
      };
    },
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  },
  i18n: {
    lng: env.PAYLOAD_ADMIN_LOCALE,
    fallbackLng: env.PAYLOAD_ADMIN_LOCALE,
    resources: adminI18nResources,
  },
  db: createPostgresAdapter({
    push: allowDatabasePush,
    pool: {
      ...(isProductionBuild ? { allowExitOnIdle: true, idleTimeoutMillis: 1000 } : {}),
      connectionString: env.DATABASE_URI,
      connectionTimeoutMillis: 5000,
      min: databasePoolMin,
      max: databasePoolMax,
    },
  }),
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => localizeLexicalFeatures(defaultFeatures),
  }),
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
});
