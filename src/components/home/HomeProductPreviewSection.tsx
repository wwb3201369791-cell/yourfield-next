'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, type MouseEvent } from 'react';

import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import type { ProductGroupId } from '@/lib/mock/products';

export type HomeProductScenarioView = Readonly<{
  group: ProductGroupId;
  label: string;
}>;

export type HomeProductPreviewView = Readonly<{
  categoryName: string;
  description: string;
  detailHref: string;
  groupId: ProductGroupId;
  id: string;
  image: string;
  name: string;
  viewMoreHref: string;
}>;

export type HomeProductPreviewSectionProps = Readonly<{
  emptyText: string;
  scenarioLabel: string;
  scenarios: readonly HomeProductScenarioView[];
  products: readonly HomeProductPreviewView[];
  viewMoreLabel: string;
}>;

const warmedProductPreviewHrefs = new Set<string>();

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function normalizedInternalHref(href: string) {
  try {
    const url = new URL(href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    url.hash = '';

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function warmProductPreviewHref(href: string, prefetch: (href: string) => void) {
  const prefetchHref = normalizedInternalHref(href);

  if (!prefetchHref || warmedProductPreviewHrefs.has(prefetchHref)) {
    return;
  }

  warmedProductPreviewHrefs.add(prefetchHref);

  const isLocalDevelopmentHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalDevelopmentHost && typeof window.fetch === 'function') {
    void window
      .fetch(prefetchHref, { credentials: 'same-origin' })
      .then(() => prefetch(prefetchHref))
      .catch(() => {
        warmedProductPreviewHrefs.delete(prefetchHref);
      });
    return;
  }

  prefetch(prefetchHref);
}

export function HomeProductPreviewSection({
  emptyText,
  scenarioLabel,
  scenarios,
  products,
  viewMoreLabel,
}: HomeProductPreviewSectionProps) {
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState<ProductGroupId>(
    scenarios[0]?.group ?? products[0]?.groupId ?? 'fire-rescue',
  );
  const [hasScenarioSelection, setHasScenarioSelection] = useState(false);
  const cardRefs = useRef(new Map<ProductGroupId, HTMLElement>());

  const warmPreviewHref = useCallback(
    (href: string) => {
      warmProductPreviewHref(href, (prefetchHref) => router.prefetch(prefetchHref));
    },
    [router],
  );

  function activateScenario(group: ProductGroupId) {
    setActiveGroup(group);
    setHasScenarioSelection(true);

    window.requestAnimationFrame(() => {
      cardRefs.current.get(group)?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });
  }

  function handleScenarioClick(group: ProductGroupId, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    activateScenario(group);
  }

  function handlePreviewLinkClick(href: string, event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    warmPreviewHref(href);
  }

  return (
    <>
      <div className="home-product-scenarios" aria-label={scenarioLabel}>
        {scenarios.map((scenario) => {
          const isActive = scenario.group === activeGroup;

          return (
            <a
              key={scenario.group}
              className={`home-product-scenario ${isActive ? 'is-active' : ''}`}
              href={`#home-product-${scenario.group}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={(event) => handleScenarioClick(scenario.group, event)}
            >
              <span>{scenario.label}</span>
            </a>
          );
        })}
      </div>

      <div className="home-product-preview" aria-live="polite">
        {products.length > 0 ? (
          <div className="home-product-preview-track">
            {products.map((product) => {
              const isHighlighted = hasScenarioSelection && product.groupId === activeGroup;

              return (
                <article
                  key={product.id}
                  id={`home-product-${product.groupId}`}
                  ref={(element) => {
                    if (element) {
                      cardRefs.current.set(product.groupId, element);
                    } else {
                      cardRefs.current.delete(product.groupId);
                    }
                  }}
                  className={`home-preview-card ${isHighlighted ? 'is-highlighted' : ''}`}
                >
                  <Link
                    className="home-preview-card__image"
                    href={product.detailHref}
                    prefetch={false}
                    aria-label={`${viewMoreLabel}: ${product.name}`}
                    onClick={(event) => handlePreviewLinkClick(product.detailHref, event)}
                    onFocus={() => warmPreviewHref(product.detailHref)}
                    onMouseEnter={() => warmPreviewHref(product.detailHref)}
                    onPointerDown={() => warmPreviewHref(product.detailHref)}
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1180px) 25vw, (min-width: 768px) 46vw, 88vw"
                        unoptimized={shouldUseUnoptimizedImage(product.image)}
                      />
                    ) : (
                      <span className="product-image-empty">
                        <strong>{product.categoryName}</strong>
                        <span>{product.name}</span>
                      </span>
                    )}
                  </Link>
                  <div className="home-preview-card__body">
                    <span className="home-preview-card__category">{product.categoryName}</span>
                    <h3>
                      <Link
                        className="home-preview-card__title-link"
                        href={product.detailHref}
                        prefetch={false}
                        onClick={(event) => handlePreviewLinkClick(product.detailHref, event)}
                        onFocus={() => warmPreviewHref(product.detailHref)}
                        onMouseEnter={() => warmPreviewHref(product.detailHref)}
                        onPointerDown={() => warmPreviewHref(product.detailHref)}
                      >
                        {product.name}
                      </Link>
                    </h3>
                    <p>{product.description}</p>
                  <div className="home-preview-card__actions">
                      <Link
                        className="partner-insight__link"
                        href={product.viewMoreHref}
                        prefetch={false}
                        aria-label={`${viewMoreLabel}: ${product.categoryName}`}
                        onClick={(event) => handlePreviewLinkClick(product.viewMoreHref, event)}
                        onFocus={() => warmPreviewHref(product.viewMoreHref)}
                        onMouseEnter={() => warmPreviewHref(product.viewMoreHref)}
                        onPointerDown={() => warmPreviewHref(product.viewMoreHref)}
                      >
                        <span>{viewMoreLabel}</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="detail-loading">{emptyText}</p>
        )}
      </div>
    </>
  );
}
