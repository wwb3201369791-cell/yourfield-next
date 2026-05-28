'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

function getCurrentHashId() {
  try {
    return decodeURIComponent(window.location.hash.replace(/^#/, ''));
  } catch {
    return window.location.hash.replace(/^#/, '');
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HashScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    let scrollFrame = 0;
    const timers: number[] = [];

    function scrollToCurrentHash(smooth: boolean) {
      const hashId = getCurrentHashId();

      if (!hashId) {
        return;
      }

      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const target = document.getElementById(hashId);

        if (!target) {
          return;
        }

        target.scrollIntoView({
          behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
          block: 'start',
        });
      });
    }

    function scheduleHashScroll(smooth: boolean) {
      scrollToCurrentHash(smooth);
      timers.push(window.setTimeout(() => scrollToCurrentHash(smooth), 120));
      timers.push(window.setTimeout(() => scrollToCurrentHash(smooth), 420));
    }

    function handleHashChange() {
      scheduleHashScroll(true);
    }

    scheduleHashScroll(false);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }

      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname]);

  return null;
}
