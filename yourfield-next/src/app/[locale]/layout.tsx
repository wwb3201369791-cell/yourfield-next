import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Footer } from '@/components/footer/Footer';
import { Header } from '@/components/header/Header';
import { getMessagesForLocale } from '@/lib/i18n/getMessages';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { isLocale, locales } from '@/lib/i18n/locale';
import { normalizeMessageKey, type MessageTree } from '@/lib/i18n/messages';
import { mainNavigation, type NavigationItem } from '@/lib/navigation';

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: {
    locale: string;
  };
}>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function collectNavigationKeys(items: readonly NavigationItem[]): string[] {
  return items.flatMap((item) => [
    item.labelKey,
    ...(item.children ? collectNavigationKeys(item.children) : []),
  ]);
}

const clientMessageKeys = Array.from(
  new Set([
    ...collectNavigationKeys(mainNavigation),
    'language.label',
    'language.switching',
    'nav.openMenu',
    'nav.closeMenu',
    'search.label',
    'search.shortPlaceholder',
    'search.clear',
    'search.submit',
    'error.runtime.eyebrow',
    'error.runtime.title',
    'error.runtime.text',
    'error.runtime.errorId',
    'error.runtime.retry',
    'error.runtime.home',
  ]),
);

function getClientMessages(locale: (typeof locales)[number]) {
  const allMessages = getMessagesForLocale(locale);
  const clientMessages: MessageTree = {};

  for (const key of clientMessageKeys) {
    const normalizedKey = normalizeMessageKey(key);
    const value = allMessages[normalizedKey];

    if (typeof value !== 'string') {
      throw new Error(`Missing client i18n message: ${key}`);
    }

    clientMessages[normalizedKey] = value;
  }

  return clientMessages;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  setRequestLocale(params.locale);

  const [messages, t] = await Promise.all([
    Promise.resolve(getClientMessages(params.locale)),
    getTranslations(params.locale),
  ]);

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
