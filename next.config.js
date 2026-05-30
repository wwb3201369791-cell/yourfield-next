import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

export const defaultBuildWorkerCount = 1;

export function getBuildWorkerCount(value) {
  if (!value) {
    return defaultBuildWorkerCount;
  }

  const parsedValue = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
}

export function remotePatternFromUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const pathname = `${url.pathname.replace(/\/$/, '') || ''}/**`;

    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port,
      pathname,
    };
  } catch {
    return null;
  }
}

const legacyRedirects = [
  { source: '/index.html', destination: '/', permanent: true },
  { source: '/index.htm', destination: '/', permanent: true },
  { source: '/about.html', destination: '/zh/about', permanent: true },
  { source: '/products.html', destination: '/zh/products', permanent: true },
  { source: '/news.html', destination: '/zh/news', permanent: true },
  { source: '/solutions.html', destination: '/zh/solutions', permanent: true },
  { source: '/franchise.html', destination: '/zh/franchise', permanent: true },
  { source: '/contact.html', destination: '/zh/contact', permanent: true },
  {
    source: '/product-firefighter.html',
    destination: '/zh/products/firefighter-suit-combat',
    permanent: true,
  },
  {
    source: '/product-arcflash.html',
    destination: '/zh/products/arc-flash-suit',
    permanent: true,
  },
  {
    source: '/product-chemical.html',
    destination: '/zh/products/chemical-protective-suit',
    permanent: true,
  },
  {
    source: '/product-gloves.html',
    destination: '/zh/products/insulating-gloves',
    permanent: true,
  },
  {
    source: '/product-medical.html',
    destination: '/zh/products/medical-protective-clothing',
    permanent: true,
  },
  {
    source: '/product-shielding.html',
    destination: '/zh/products/live-line-shielding-suit',
    permanent: true,
  },
  {
    source: '/product-welding.html',
    destination: '/zh/products/welding-protective-clothing',
    permanent: true,
  },
];

const remoteAssetImagePattern = remotePatternFromUrl(process.env.S3_PUBLIC_URL_BASE);
const buildWorkerCount = getBuildWorkerCount(process.env.NEXT_BUILD_WORKERS);
export const serverExternalPackages = [
  'payload',
  '@payloadcms/db-postgres',
  '@payloadcms/plugin-cloud-storage',
  '@payloadcms/storage-s3',
  'pinyin-pro',
];
export const serverComponentsExternalPackages = serverExternalPackages;
const experimentalConfig = {};

if (buildWorkerCount) {
  experimentalConfig.cpus = buildWorkerCount;
}

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Download-Options',
    value: 'noopen',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: experimentalConfig,
  serverExternalPackages,
  poweredByHeader: false,
  ...(remoteAssetImagePattern ? { images: { remotePatterns: [remoteAssetImagePattern] } } : {}),
  trailingSlash: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return legacyRedirects;
  },
  webpack(config) {
    const extensions = config.resolve?.extensions ?? [];

    config.resolve.extensions = [
      '.tsx',
      '.ts',
      ...extensions.filter((extension) => extension !== '.tsx' && extension !== '.ts'),
    ];
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        message: /the request of a dependency is an expression/,
        module: /src[\\/]payload\.config\.ts/,
      },
    ];

    return config;
  },
};

export default withNextIntl(nextConfig);
