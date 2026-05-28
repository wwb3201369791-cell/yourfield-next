'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type AboutSectionNavItem = Readonly<{
  id: string;
  label: string;
}>;

type AboutSectionNavProps = Readonly<{
  currentLabel: string;
  label: string;
  sections: readonly AboutSectionNavItem[];
}>;

type NavigationLock = Readonly<{
  id: string;
  releaseAt: number;
}>;

function currentTime() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function sectionProbeOffset() {
  const stickyNav = document.querySelector('.about-section-nav');
  const stickyBottom = stickyNav?.getBoundingClientRect().bottom ?? 0;

  return Math.min(Math.max(stickyBottom + 24, 120), window.innerHeight * 0.42);
}

function sectionScrollOffset() {
  const stickyNav = document.querySelector('.about-section-nav');
  const stickyRect = stickyNav?.getBoundingClientRect();
  const stickyTop = stickyNav ? Number.parseFloat(window.getComputedStyle(stickyNav).top) : 0;
  const stickyHeight = stickyRect?.height || 66;

  return Math.max((Number.isFinite(stickyTop) ? stickyTop : 0) + stickyHeight + 24, 120);
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function AboutSectionNav({ currentLabel, label, sections }: AboutSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const navigationLockRef = useRef<NavigationLock | null>(null);
  const activeLabel =
    sections.find((section) => section.id === activeId)?.label ?? sections[0]?.label ?? '';

  const handleSectionClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      event.preventDefault();

      navigationLockRef.current = {
        id: sectionId,
        releaseAt: currentTime() + 1200,
      };
      setActiveId(sectionId);
      window.history.pushState(null, '', `#${sectionId}`);
      window.scrollTo({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - sectionScrollOffset()),
      });
    },
    [],
  );

  useEffect(() => {
    if (sections.length === 0 || typeof window === 'undefined') {
      return undefined;
    }

    const observedSections = sections
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (observedSections.length === 0) {
      return undefined;
    }

    const knownIds = new Set(observedSections.map((section) => section.id));
    let scrollFrame = 0;
    let syncTimer = 0;

    function activeIdFromScroll() {
      const probeY = sectionProbeOffset();
      let nextActiveId = observedSections[0]?.id ?? '';

      observedSections.forEach((section) => {
        if (section.getBoundingClientRect().top <= probeY + 12) {
          nextActiveId = section.id;
        }
      });

      return nextActiveId;
    }

    function syncFromScroll() {
      const navigationLock = navigationLockRef.current;
      if (navigationLock) {
        const lockedSection = document.getElementById(navigationLock.id);
        const lockedDistance = lockedSection
          ? Math.abs(lockedSection.getBoundingClientRect().top - sectionScrollOffset())
          : 0;

        if (currentTime() < navigationLock.releaseAt && lockedDistance > 18) {
          return;
        }

        navigationLockRef.current = null;
      }

      const nextActiveId = activeIdFromScroll();
      if (nextActiveId) {
        setActiveId((currentId) => (currentId === nextActiveId ? currentId : nextActiveId));
      }
    }

    function requestScrollSync() {
      if (scrollFrame) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        syncFromScroll();
      });
    }

    function hashIdFromLocation() {
      try {
        return decodeURIComponent(window.location.hash.replace(/^#/, ''));
      } catch {
        return window.location.hash.replace(/^#/, '');
      }
    }

    function syncFromHash() {
      const hashId = hashIdFromLocation();
      if (hashId && knownIds.has(hashId)) {
        navigationLockRef.current = null;
        setActiveId(hashId);
      }
      requestScrollSync();
    }

    syncFromHash();
    syncTimer = window.setTimeout(requestScrollSync, 180);

    window.addEventListener('scroll', requestScrollSync, { passive: true });
    window.addEventListener('resize', requestScrollSync);
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('popstate', syncFromHash);

    return () => {
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      if (syncTimer) {
        window.clearTimeout(syncTimer);
      }
      window.removeEventListener('scroll', requestScrollSync);
      window.removeEventListener('resize', requestScrollSync);
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('popstate', syncFromHash);
    };
  }, [sections]);

  return (
    <nav className="about-section-nav" aria-label={label}>
      <div className="container">
        <div className="about-section-nav__status">
          <span>{currentLabel}</span>
          <strong>{activeLabel}</strong>
        </div>
        <div className="about-section-nav__viewport">
          <ul className="about-section-nav__links">
            {sections.map((section) => (
              <li key={section.id}>
                <Link
                  className={activeId === section.id ? 'is-active' : ''}
                  href={`#${section.id}`}
                  aria-current={activeId === section.id ? 'location' : undefined}
                  onClick={(event) => handleSectionClick(event, section.id)}
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
