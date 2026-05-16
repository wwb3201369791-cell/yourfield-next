import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Footer } from '@/components/footer/Footer';
import { Header } from '@/components/header/Header';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { isLocale, locales } from '@/lib/i18n/locale';

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: {
    locale: string;
  };
}>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  setRequestLocale(params.locale);

  const [messages, t] = await Promise.all([getMessages(), getTranslations(params.locale)]);

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <div className="site-shell">
        <a className="skip-link" href="#main-content">
          {t('common.skipToMain')}
        </a>
        <Header locale={params.locale} />
        <main className="site-main" id="main-content">
          {children}
        </main>
        <Footer locale={params.locale} />
      </div>
    </NextIntlClientProvider>
  );
}
