'use client';

import { ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  type CookieNoticeChoice,
  createCookieNoticeState,
  cookieConsentStorageKey,
  cookieNoticeStorageKey,
  parseCookieNoticeState,
} from '@/lib/compliance/cookieConsent';

export type CookieBannerCopy = Readonly<{
  accept: string;
  body: string;
  close: string;
  linkLabel: string;
  reject: string;
  title: string;
}>;

type CookieBannerProps = Readonly<{
  cookiesHref: string;
  copy: CookieBannerCopy;
  enabled: boolean;
}>;

export function CookieBanner({ cookiesHref, copy, enabled }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    try {
      window.localStorage.removeItem(cookieConsentStorageKey);
      setIsVisible(!parseCookieNoticeState(window.localStorage.getItem(cookieNoticeStorageKey)));
    } catch {
      setIsVisible(true);
    }
  }, [enabled]);

  function saveChoice(choice: CookieNoticeChoice) {
    try {
      window.localStorage.removeItem(cookieConsentStorageKey);
      window.localStorage.setItem(
        cookieNoticeStorageKey,
        JSON.stringify(createCookieNoticeState(choice)),
      );
    } catch {
      // In strict privacy modes this notice applies for the current session only.
    }

    setIsVisible(false);
  }

  if (!enabled || !isVisible) {
    return null;
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[1500] border-t border-border bg-white/[0.94] px-4 py-3 text-primary shadow-[0_-18px_50px_rgba(5,18,33,0.16)] backdrop-blur-xl sm:px-6"
      role="region"
      aria-label={copy.title}
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 pr-10 md:flex-row md:items-center md:justify-between md:gap-6 md:pr-0">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded border border-border bg-white text-primary shadow-sm"
            aria-hidden="true"
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-tight text-primary sm:text-base">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-light">
              {copy.body}{' '}
              <Link
                className="decoration-accent/70 font-bold text-primary underline underline-offset-4 transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                href={cookiesHref}
                onClick={() => saveChoice('dismissed')}
              >
                {copy.linkLabel}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:flex-none">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded border border-border bg-white px-4 text-sm font-bold text-primary transition hover:border-primary hover:bg-bg-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            type="button"
            onClick={() => saveChoice('rejected')}
          >
            {copy.reject}
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            type="button"
            onClick={() => saveChoice('accepted')}
          >
            {copy.accept}
          </button>
        </div>
      </div>
      <button
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded text-text-light transition hover:bg-bg-light hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:right-4"
        type="button"
        aria-label={copy.close}
        onClick={() => saveChoice('dismissed')}
      >
        <X className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
      </button>
    </aside>
  );
}
