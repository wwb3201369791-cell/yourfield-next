import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

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

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  async redirects() {
    return legacyRedirects;
  },
};

export default withNextIntl(nextConfig);
