'use client';

import { useEffect, useMemo, useState } from 'react';

import { createErrorId, type ErrorWithDigest } from '@/lib/errors/errorId';

type GlobalErrorProps = Readonly<{
  error: ErrorWithDigest;
  reset: () => void;
}>;

type GlobalLocale = 'zh' | 'en' | 'ru';

const htmlLangByLocale: Record<GlobalLocale, string> = {
  zh: 'zh-CN',
  en: 'en',
  ru: 'ru',
};

const globalErrorMessages: Record<
  GlobalLocale,
  {
    eyebrow: string;
    title: string;
    text: string;
    errorId: string;
    retry: string;
    home: string;
  }
> = {
  zh: {
    eyebrow: '系统错误',
    title: '页面暂时无法打开',
    text: '请重新尝试，或返回首页继续浏览永霏防护内容。',
    errorId: '错误 ID',
    retry: '重新尝试',
    home: '返回首页',
  },
  en: {
    eyebrow: 'System error',
    title: 'This page is temporarily unavailable',
    text: 'Please try again, or return to the homepage to continue browsing YourField.',
    errorId: 'Error ID',
    retry: 'Try again',
    home: 'Back home',
  },
  ru: {
    eyebrow: 'Системная ошибка',
    title: 'Страница временно недоступна',
    text: 'Попробуйте еще раз или вернитесь на главную страницу YourField.',
    errorId: 'ID ошибки',
    retry: 'Повторить',
    home: 'На главную',
  },
};

function resolveBrowserLocale(): GlobalLocale {
  if (typeof navigator === 'undefined') {
    return 'zh';
  }

  const language = navigator.language.toLowerCase();

  if (language.startsWith('ru')) {
    return 'ru';
  }

  if (language.startsWith('en')) {
    return 'en';
  }

  return 'zh';
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [locale, setLocale] = useState<GlobalLocale>('zh');
  const errorId = useMemo(() => createErrorId(error, 'global'), [error]);
  const messages = globalErrorMessages[locale];

  useEffect(() => {
    setLocale(resolveBrowserLocale());
  }, []);

  return (
    <html lang={htmlLangByLocale[locale]}>
      <body>
        <main className="min-h-screen bg-bg-light px-5 py-10 text-text md:px-8">
          <section className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-6xl gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-center">
            <div
              className="flex aspect-[4/3] items-center justify-center rounded border border-border bg-white shadow-sm"
              aria-hidden="true"
            >
              <span className="text-primary/10 text-[clamp(4.75rem,16vw,13rem)] font-bold leading-none">
                500
              </span>
            </div>
            <div className="max-w-2xl">
              <p className="section-tag">{messages.eyebrow}</p>
              <h1 className="text-balance text-4xl font-bold text-primary md:text-5xl">
                {messages.title}
              </h1>
              <p className="mt-5 text-base leading-8 text-text-light md:text-lg">{messages.text}</p>
              <p className="mt-4 inline-flex rounded border border-border bg-white px-4 py-2 text-sm font-semibold text-text-light">
                {messages.errorId}: {errorId}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="btn btn-primary" type="button" onClick={reset}>
                  {messages.retry}
                </button>
                <a className="btn btn-secondary" href={`/${locale}`}>
                  {messages.home}
                </a>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
