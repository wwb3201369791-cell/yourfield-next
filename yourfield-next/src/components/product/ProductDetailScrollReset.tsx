'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';

const loadingScrollResetMarkerPrefix = 'yourfield:product-detail-loading-scroll-reset:';
const loadingScrollResetMarkerMaxAgeMs = 10_000;

function scrollToPageTop() {
  window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
}

function isAtPageTop() {
  return window.scrollY <= 1;
}

function markerKey(pathname: string) {
  return `${loadingScrollResetMarkerPrefix}${pathname}`;
}

function markLoadingScrollReset(pathname: string) {
  try {
    window.sessionStorage.setItem(markerKey(pathname), String(Date.now()));
  } catch {
    // Session storage can be unavailable in strict browser privacy modes.
  }
}

function consumeLoadingScrollReset(pathname: string) {
  try {
    const key = markerKey(pathname);
    const value = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);

    if (!value) {
      return false;
    }

    const markerTime = Number(value);

    return (
      Number.isFinite(markerTime) && Date.now() - markerTime <= loadingScrollResetMarkerMaxAgeMs
    );
  } catch {
    return false;
  }
}

export function ProductDetailLoadingScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!pathname || window.location.hash) {
      return undefined;
    }

    markLoadingScrollReset(pathname);

    if (!isAtPageTop()) {
      scrollToPageTop();
    }

    return undefined;
  }, [pathname]);

  return null;
}

export function ProductDetailScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!pathname || window.location.hash || consumeLoadingScrollReset(pathname) || isAtPageTop()) {
      return undefined;
    }

    scrollToPageTop();
    return undefined;
  }, [pathname]);

  return null;
}
