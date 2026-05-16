import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import { defaultLocale, isLocale } from '@/lib/i18n/locale';

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  const requestLocale = headers().get('x-next-intl-locale') ?? undefined;
  const locale = isLocale(requestLocale) ? requestLocale : defaultLocale;

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
