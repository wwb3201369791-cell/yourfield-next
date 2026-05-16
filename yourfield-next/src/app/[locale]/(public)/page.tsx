import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getTranslations } from '@/lib/i18n/getTranslations';
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

  const t = await getTranslations(params.locale);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-180px)] max-w-5xl flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-4xl font-semibold text-primary">{t('common.home')}</h1>
      <p className="text-lg text-text-light">
        {t('nav.products')} / {t('nav.contact')}
      </p>
      <p className="rounded border border-border bg-bg-light px-3 py-1 text-sm text-text-light">
        {t('common.currentLocale')}: {params.locale}
      </p>
    </section>
  );
}
