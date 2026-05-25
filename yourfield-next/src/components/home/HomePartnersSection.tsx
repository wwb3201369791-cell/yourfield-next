'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export type HomePartnerShowcaseItem = Readonly<{
  href: string;
  image: string;
  name: string;
  sector: string;
  summary: string;
  visualTitle: string;
}>;

export type HomePartnersSectionProps = Readonly<{
  ariaLabel: string;
  clientsMetric: string;
  industriesMetric: string;
  items: readonly HomePartnerShowcaseItem[];
  linkLabel: string;
  metricsAriaLabel: string;
  projectsMetric: string;
  tag: string;
  text: string;
  title: string;
  visualAlt: string;
}>;

function visibleIndexes(items: readonly HomePartnerShowcaseItem[], activeIndex: number) {
  return items.map((_, index) => index).filter((index) => index !== activeIndex);
}

function normalizedVisibleIndex(index: number, length: number) {
  return (index + length) % length;
}

export function HomePartnersSection({
  ariaLabel,
  clientsMetric,
  industriesMetric,
  items,
  linkLabel,
  metricsAriaLabel,
  projectsMetric,
  tag,
  text,
  title,
  visualAlt,
}: HomePartnersSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visualChanging, setVisualChanging] = useState(false);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasPresentedInitialVisualRef = useRef(false);
  const activeItem = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (!activeItem) {
      return undefined;
    }

    if (!hasPresentedInitialVisualRef.current) {
      hasPresentedInitialVisualRef.current = true;
      setVisualChanging(false);
      return undefined;
    }

    setVisualChanging(true);
    const timeoutId = window.setTimeout(() => setVisualChanging(false), 540);

    return () => window.clearTimeout(timeoutId);
  }, [activeItem]);

  const focusFirstVisibleCard = useCallback(
    (nextActiveIndex: number) => {
      const firstVisibleIndex = visibleIndexes(items, nextActiveIndex)[0];

      if (firstVisibleIndex !== undefined) {
        window.requestAnimationFrame(() => {
          cardRefs.current[firstVisibleIndex]?.focus({ preventScroll: true });
        });
      }
    },
    [items],
  );

  const activateCard = useCallback(
    (index: number, shouldFocus: boolean) => {
      setActiveIndex(index);

      if (shouldFocus) {
        focusFirstVisibleCard(index);
      }
    },
    [focusFirstVisibleCard],
  );

  const focusByOffset = useCallback(
    (currentIndex: number, offset: number) => {
      const indexes = visibleIndexes(items, activeIndex);
      const currentVisibleIndex = indexes.indexOf(currentIndex);
      const nextVisibleIndex =
        currentVisibleIndex >= 0
          ? normalizedVisibleIndex(currentVisibleIndex + offset, indexes.length)
          : 0;
      const nextIndex = indexes[nextVisibleIndex];

      if (nextIndex !== undefined) {
        cardRefs.current[nextIndex]?.focus({ preventScroll: true });
      }
    },
    [activeIndex, items],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateCard(index, true);
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        focusByOffset(index, 1);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusByOffset(index, -1);
        return;
      }

      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const indexes = visibleIndexes(items, activeIndex);
        const nextIndex = indexes[event.key === 'Home' ? 0 : indexes.length - 1];

        if (nextIndex !== undefined) {
          cardRefs.current[nextIndex]?.focus({ preventScroll: true });
        }
      }
    },
    [activeIndex, activateCard, focusByOffset, items],
  );

  if (!activeItem) {
    return null;
  }

  return (
    <section className="partners" aria-labelledby="partners-title">
      <div className="container" data-partner-showcase>
        <div className="partners-layout">
          <div className="partners-copy">
            <div className="section-header partners-header">
              <span className="section-tag">{tag}</span>
              <h2 id="partners-title">{title}</h2>
              <p>{text}</p>
            </div>
            <div
              className="partner-insight"
              id="partner-showcase-panel"
              role="region"
              aria-live="polite"
            >
              <span className="partner-insight__tag">{activeItem.sector}</span>
              <h3>{activeItem.name}</h3>
              <p>{activeItem.summary}</p>
              <Link className="partner-insight__link" href={activeItem.href}>
                <span>{linkLabel}</span>
              </Link>
            </div>
            <div className="partner-proof" aria-label={metricsAriaLabel}>
              <div className="partner-proof-item">
                <strong>120+</strong>
                <span>{clientsMetric}</span>
              </div>
              <div className="partner-proof-item">
                <strong>6</strong>
                <span>{industriesMetric}</span>
              </div>
              <div className="partner-proof-item">
                <strong>20+</strong>
                <span>{projectsMetric}</span>
              </div>
            </div>
          </div>
          <div
            className={['partners-visual', visualChanging ? 'is-changing' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <Image
              key={activeItem.image}
              src={activeItem.image}
              alt={visualAlt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
            <span className="partners-visual__shade" aria-hidden="true" />
            <div className="partners-visual__caption">
              <strong>{activeItem.visualTitle}</strong>
            </div>
          </div>
        </div>
        <div className="partners-logos" role="group" aria-label={ariaLabel}>
          {items.map((partner, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={partner.name}
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                className={['partner-logo', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                type="button"
                hidden={isActive}
                aria-hidden={isActive}
                tabIndex={isActive ? -1 : 0}
                onClick={() => activateCard(index, true)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
              >
                <span className="partner-logo__copy">
                  <strong>{partner.name}</strong>
                  <span>{partner.sector}</span>
                </span>
                <span className="partner-logo__thumb" aria-hidden="true">
                  <Image src={partner.image} alt="" fill sizes="180px" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
