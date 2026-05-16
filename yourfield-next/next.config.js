import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // P1 will add legacy URL redirects and production-specific headers.
};

export default withNextIntl(nextConfig);
