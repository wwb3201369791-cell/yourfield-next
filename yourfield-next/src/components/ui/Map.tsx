'use client';

import { useEffect, useRef, useState } from 'react';

import type { Locale } from '@/lib/i18n/locale';

type CompanyMapProps = Readonly<{
  locale: Locale;
  title: string;
  text: string;
  address: string;
  placeholder: string;
  frameTitle: string;
  cityLabel: string;
  cityValue: string;
  accessLabel: string;
  accessValue: string;
  openMapLabel: string;
}>;

type MapService = Readonly<{
  badge: string;
  externalUrl: string;
  iframeUrl: string | null;
}>;

const coordinates = {
  amap: '112.989066,27.816329',
  google: '27.816329,112.989066',
};

function buildMapService(locale: Locale): MapService {
  if (locale === 'zh') {
    const url = new URL('https://uri.amap.com/marker');
    url.searchParams.set('position', coordinates.amap);
    url.searchParams.set('name', '湖南永霏特种防护用品有限公司');
    url.searchParams.set('src', 'yourfield');
    url.searchParams.set('coordinate', 'gaode');
    url.searchParams.set('callnative', '0');

    return {
      badge: '高德地图',
      externalUrl: url.toString(),
      iframeUrl: null,
    };
  }

  const language = locale === 'ru' ? 'ru' : 'en';
  const frameUrl = new URL('https://www.google.com/maps');
  frameUrl.searchParams.set('q', coordinates.google);
  frameUrl.searchParams.set('z', '15');
  frameUrl.searchParams.set('output', 'embed');
  frameUrl.searchParams.set('hl', language);

  const externalUrl = new URL('https://www.google.com/maps/search/');
  externalUrl.searchParams.set('api', '1');
  externalUrl.searchParams.set('query', coordinates.google);
  externalUrl.searchParams.set('hl', language);

  return {
    badge: 'Google Maps',
    externalUrl: externalUrl.toString(),
    iframeUrl: frameUrl.toString(),
  };
}

export function CompanyMap({
  locale,
  title,
  text,
  address,
  placeholder,
  frameTitle,
  cityLabel,
  cityValue,
  accessLabel,
  accessValue,
  openMapLabel,
}: CompanyMapProps) {
  const mapService = buildMapService(locale);
  const timeoutRef = useRef<number | null>(null);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);

  useEffect(() => {
    setIsFrameLoaded(false);

    if (!mapService.iframeUrl) {
      return undefined;
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsFrameLoaded(false);
    }, 6500);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [mapService.iframeUrl]);

  function handleFrameLoad() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setIsFrameLoaded(true);
  }

  function handleFrameError() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setIsFrameLoaded(false);
  }

  return (
    <div
      className="relative min-h-[540px] overflow-hidden rounded-lg border border-[rgba(30,58,95,0.12)] bg-[#eef3f7] shadow-lg"
      aria-label={frameTitle}
    >
      <div
        className="absolute inset-0 bg-[url('/images/headers/contact-us.png')] bg-cover bg-center"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,31,53,0.86),rgba(30,58,95,0.72))]" />
        <div className="absolute inset-0 opacity-45">
          <div className="absolute left-[12%] top-[24%] h-px w-[72%] rotate-[-14deg] bg-white/45" />
          <div className="absolute left-[18%] top-[58%] h-px w-[70%] rotate-[12deg] bg-white/35" />
          <div className="absolute left-[34%] top-[9%] h-[82%] w-px rotate-[18deg] bg-white/30" />
          <div className="absolute left-[66%] top-[12%] h-[78%] w-px rotate-[-17deg] bg-white/25" />
        </div>
        <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-lg">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {mapService.iframeUrl ? (
        <iframe
          className={[
            'absolute inset-0 h-full w-full border-0 transition-opacity duration-300',
            isFrameLoaded ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          title={frameTitle}
          src={mapService.iframeUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={handleFrameLoad}
          onError={handleFrameError}
        />
      ) : null}

      <div className="absolute left-4 right-4 top-4 z-10 grid gap-4 rounded border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur md:left-6 md:right-auto md:top-6 md:w-[min(360px,calc(100%-48px))]">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent text-white shadow"
            aria-hidden="true"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
              {mapService.badge}
            </p>
            <h3 className="mt-2 text-xl font-bold leading-7 text-primary">{title}</h3>
            <address className="text-primary/70 mt-2 text-sm not-italic leading-6">
              {address}
            </address>
          </div>
        </div>

        <p className="text-sm leading-6 text-text-light">{text}</p>

        <dl className="grid grid-cols-2 gap-4 border-y border-white/70 py-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-accent">
              {cityLabel}
            </dt>
            <dd className="mt-1 text-sm font-bold text-primary">{cityValue}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-accent">
              {accessLabel}
            </dt>
            <dd className="mt-1 text-sm font-bold text-primary">{accessValue}</dd>
          </div>
        </dl>

        <p className="text-primary/60 text-xs leading-5">{placeholder}</p>

        <a
          className="btn btn-secondary justify-self-start"
          href={mapService.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {openMapLabel}
        </a>
      </div>
    </div>
  );
}
