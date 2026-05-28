'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { ErrorState } from '@/components/public/ErrorState';
import { ArrowRightIcon } from '@/components/ui/icons';
import { createErrorId, type ErrorWithDigest } from '@/lib/errors/errorId';
import { useTranslations } from '@/lib/i18n/useTranslations';

type ErrorPageProps = Readonly<{
  error: ErrorWithDigest;
  reset: () => void;
}>;

const clientLocales = ['zh', 'en', 'ru'] as const;

function resolveClientLocale(value: string | string[] | undefined) {
  const locale = Array.isArray(value) ? value[0] : value;

  return clientLocales.includes(locale as (typeof clientLocales)[number]) ? locale : 'zh';
}

export default function LocaleErrorPage({ error, reset }: ErrorPageProps) {
  const params = useParams();
  const locale = resolveClientLocale(params?.locale);
  const t = useTranslations();
  const errorId = useMemo(() => createErrorId(error, 'runtime'), [error]);

  return (
    <ErrorState
      eyebrow={t('error.runtime.eyebrow')}
      meta={`${t('error.runtime.errorId')}: ${errorId}`}
      status="500"
      text={t('error.runtime.text')}
      title={t('error.runtime.title')}
    >
      <button className="btn btn-primary gap-2" type="button" onClick={reset}>
        {t('error.runtime.retry')}
        <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
      </button>
      <Link className="btn btn-secondary" href={`/${locale}`}>
        {t('error.runtime.home')}
      </Link>
    </ErrorState>
  );
}
