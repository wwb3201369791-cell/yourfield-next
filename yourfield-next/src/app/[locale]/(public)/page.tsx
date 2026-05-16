import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { isLocale } from '@/lib/i18n/locale';

type LocalePageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

export default async function LocalePage({ params }: LocalePageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  setRequestLocale(params.locale);

  const t = await getTranslations({ locale: params.locale });

  return (
    <main>
      <h1>{t('common.home')}</h1>
      <p>
        {t('nav.products')} / {t('nav.contact')}
      </p>
      <p>Locale: {params.locale}</p>
    </main>
  );
}
