import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { UmamiScript } from '@/components/analytics/UmamiScript';
import { CookieBanner, type CookieBannerCopy } from '@/components/compliance/CookieBanner';
import { Footer } from '@/components/footer/Footer';
import { Header } from '@/components/header/Header';
import { CtaBand } from '@/components/public/CtaBand';
import { HashScrollManager } from '@/components/public/HashScrollManager';
import { getCmsNavigation } from '@/lib/cms/navigation';
import { getCmsSiteSettings } from '@/lib/cms/site-settings';
import { buildSiteCta } from '@/lib/content/siteCta';
import { env } from '@/lib/env';
import { getMessagesForLocale } from '@/lib/i18n/getMessages';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { isLocale, locales } from '@/lib/i18n/locale';
import { normalizeMessageKey, type MessageTree } from '@/lib/i18n/messages';
import { getPayloadHotSearchTerms } from '@/lib/search/payload';

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: {
    locale: string;
  };
}>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const clientMessageKeys = Array.from(
  new Set([
    'nav.home',
    'language.label',
    'language.switching',
    'nav.openMenu',
    'nav.closeMenu',
    'search.label',
    'search.shortPlaceholder',
    'search.clear',
    'search.submit',
    'search.suggestions',
    'search.popular',
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

function getHeaderFallbackHotTerms(t: Awaited<ReturnType<typeof getTranslations>>) {
  return t('search.hotTerms')
    .split(/[|,，]/)
    .map((value) => value.trim())
    .filter(Boolean);
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
  const [navigation, siteSettings, hotTerms] = await Promise.all([
    getCmsNavigation(params.locale),
    getCmsSiteSettings(params.locale),
    getPayloadHotSearchTerms(params.locale, getHeaderFallbackHotTerms(t), 6),
  ]);

  const cookieBannerCopy: CookieBannerCopy = {
    body: t('cookie.notice.body'),
    close: t('cookie.notice.close'),
    linkLabel: t('cookie.notice.linkLabel'),
    title: t('cookie.notice.title'),
  };
  const umamiWebsiteId = siteSettings.analytics.umamiWebsiteId || env.UMAMI_WEBSITE_ID;
  const siteCta = buildSiteCta(params.locale, t);

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <div className="site-shell">
        <a className="skip-link" href="#main-content">
          {t('common.skipToMain')}
        </a>
        <Header
          hotTerms={hotTerms}
          locale={params.locale}
          navigation={navigation.mainNav}
          siteSettings={siteSettings}
        />
        <HashScrollManager />
        <main className="site-main" id="main-content">
          {children}
          <CtaBand {...siteCta} />
        </main>
        <Footer
          footerNavigation={navigation.footerNav}
          locale={params.locale}
          siteSettings={siteSettings}
        />
        <CookieBanner
          cookiesHref={`/${params.locale}/cookies`}
          enabled={siteSettings.cookieConsent.enabled}
          copy={cookieBannerCopy}
        />
        <UmamiScript
          enabled={siteSettings.analytics.enabled}
          scriptUrl={env.UMAMI_SCRIPT_URL}
          websiteId={umamiWebsiteId}
        />
      </div>
    </NextIntlClientProvider>
  );
}
