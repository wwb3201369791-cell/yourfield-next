import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';

import { ErrorState } from '@/components/public/ErrorState';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { defaultLocale, isLocale } from '@/lib/i18n/locale';

function getNotFoundLocale() {
  const requestLocale = headers().get('x-next-intl-locale') ?? undefined;

  return isLocale(requestLocale) ? requestLocale : defaultLocale;
}

export default async function NotFoundPage() {
  const locale = getNotFoundLocale();
  setRequestLocale(locale);

  const t = await getTranslations(locale);

  return (
    <ErrorState
      actions={[
        { href: `/${locale}`, label: t('error.404.primary') },
        { href: `/${locale}/products`, label: t('error.404.secondary'), variant: 'secondary' },
      ]}
      eyebrow={t('error.404.eyebrow')}
      status="404"
      text={t('error.404.text')}
      title={t('error.404.title')}
    />
  );
}
