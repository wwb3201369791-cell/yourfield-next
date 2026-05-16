import '@/styles/globals.css';

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { env } from '@/lib/env';
import { defaultLocale, isLocale } from '@/lib/i18n/locale';

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
};

export default function RootLayout({ children }: RootLayoutProps) {
  const requestLocale = headers().get('x-next-intl-locale') ?? undefined;
  const locale = isLocale(requestLocale) ? requestLocale : defaultLocale;

  return (
    <html lang={locale}>
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
