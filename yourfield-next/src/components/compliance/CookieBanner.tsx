'use client';

import { ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  createCookieNoticeState,
  cookieConsentStorageKey,
  cookieNoticeStorageKey,
  parseCookieNoticeState,
} from '@/lib/compliance/cookieConsent';

export type CookieBannerCopy = Readonly<{
  body: string;
  close: string;
  linkLabel: string;
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

  function dismiss() {
    try {
      window.localStorage.removeItem(cookieConsentStorageKey);
      window.localStorage.setItem(cookieNoticeStorageKey, JSON.stringify(createCookieNoticeState()));
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
      className="group fixed inset-x-4 bottom-4 z-[1500] mx-auto w-[min(38rem,calc(100vw-2rem))] overflow-hidden rounded border border-white/60 bg-white/[0.76] p-4 pr-12 text-primary shadow-[0_24px_70px_rgba(5,18,33,0.24)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.86] hover:shadow-[0_30px_80px_rgba(5,18,33,0.28)] sm:bottom-6 sm:p-4 sm:pr-12"
      role="status"
      aria-label={copy.title}
      aria-live="polite"
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/75 via-white/42 to-white/20"
        aria-hidden="true"
      />
      <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" aria-hidden="true" />
      <button
        className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded bg-white/30 text-primary/60 transition hover:bg-white/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        type="button"
        aria-label={copy.close}
        onClick={dismiss}
      >
        <X className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
      </button>
      <div className="relative flex items-start gap-3 sm:gap-4">
        <span
          className="mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded border border-white/60 bg-white/42 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
          aria-hidden="true"
        >
          <ShieldCheck className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-primary sm:text-lg">
            {copy.title}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-text-light">
            {copy.body}{' '}
            <Link
              className="font-bold text-primary underline decoration-accent/70 underline-offset-4 transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href={cookiesHref}
              onClick={dismiss}
            >
              {copy.linkLabel}
            </Link>
          </p>
        </div>
      </div>
    </aside>
  );
}
