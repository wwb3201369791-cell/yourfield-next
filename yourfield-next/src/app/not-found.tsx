import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';

import { Footer } from '@/components/footer/Footer';
import { Header } from '@/components/header/Header';
import { ErrorState } from '@/components/public/ErrorState';
import { getMessagesForLocale } from '@/lib/i18n/getMessages';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { defaultLocale, isLocale } from '@/lib/i18n/locale';

function getRootNotFoundLocale() {
  const requestLocale = headers().get('x-next-intl-locale') ?? undefined;

  return isLocale(requestLocale) ? requestLocale : defaultLocale;
}

export default async function RootNotFoundPage() {
  const locale = getRootNotFoundLocale();
  const [messages, t] = await Promise.all([
    Promise.resolve(getMessagesForLocale(locale)),
    getTranslations(locale),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="site-shell">
        <a className="skip-link" href="#main-content">
          {t('common.skipToMain')}
        </a>
        <Header locale={locale} />
        <main className="site-main" id="main-content">
          <ErrorState
            actions={[
              { href: `/${locale}`, label: t('error.404.primary') },
              {
                href: `/${locale}/products`,
                label: t('error.404.secondary'),
                variant: 'secondary',
              },
            ]}
            eyebrow={t('error.404.eyebrow')}
            status="404"
            text={t('error.404.text')}
            title={t('error.404.title')}
          />
        </main>
        <Footer locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
