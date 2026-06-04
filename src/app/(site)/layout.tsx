import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { getCmsSiteSettings } from '@/lib/cms/site-settings';
import { env } from '@/lib/env';
import { defaultLocale, getHtmlLang, isLocale } from '@/lib/i18n/locale';
import { searchEngineVerificationMetadata } from '@/lib/seo/searchEngineVerification';

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getCmsSiteSettings(defaultLocale);

  return {
    icons: {
      apple: [{ sizes: '180x180', url: '/apple-touch-icon.png' }],
      icon: [{ sizes: '64x64', type: 'image/png', url: '/favicon.png' }],
      shortcut: ['/favicon.png'],
    },
    manifest: '/manifest.webmanifest',
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    ...searchEngineVerificationMetadata(siteSettings),
  };
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1e3a5f',
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const requestLocale = (await headers()).get('x-next-intl-locale') ?? undefined;
  const locale = isLocale(requestLocale) ? requestLocale : defaultLocale;

  return (
    <html lang={getHtmlLang(locale)} suppressHydrationWarning>
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
