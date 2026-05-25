'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import type { CatalogHashTarget, CatalogSlotStatus } from '@/lib/content/productCatalog';

export type ProductCatalogFilter = Readonly<{
  active: boolean;
  href: string;
  id: string;
  label: string;
}>;

export type ProductCatalogCategoryLink = Readonly<{
  active: boolean;
  groupTitle: string;
  href: string;
  id: string;
  title: string;
}>;

export type OfficialCatalogSlotView = Readonly<{
  categoryDescription: string;
  categoryId: string;
  categoryTitle: string;
  ctaLabel: string;
  detailAvailable: boolean;
  groupId: string;
  groupTitle: string;
  href: string;
  image: string;
  model: string;
  number: string;
  sequence: number;
  slotId: string;
  standards: readonly string[];
  status: CatalogSlotStatus;
  statusLabel: string;
  title: string;
}>;

export type ProductCatalogGroupView = Readonly<{
  categorySummary: string;
  id: string;
  slots: readonly OfficialCatalogSlotView[];
  title: string;
}>;

type ProductCatalogProps = Readonly<{
  emptyState: {
    text: string;
    title: string;
  };
  groups: readonly ProductCatalogGroupView[];
  hashTargets: Record<string, CatalogHashTarget>;
  labels: {
    categoryFilter: string;
    coverage: string;
    next: string;
    previous: string;
    queryPrefix: string;
  };
  overview: {
    eyebrow: string;
    text: string;
    title: string;
  };
  query?: string;
}>;

type ActiveCatalogTarget = Readonly<{
  categoryIds: readonly string[];
  groupId: string | null;
}>;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function decodeHashId(hash: string) {
  const rawHash = hash.replace(/^#/, '');

  try {
    return decodeURIComponent(rawHash);
  } catch {
    return rawHash;
  }
}

const dragActivationThreshold = 12;

type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

const productRailOptions: EmblaOptions = {
  align: 'start',
  containScroll: 'trimSnaps',
  dragFree: true,
  duration: 20,
  loop: false,
  skipSnaps: true,
  watchDrag: true,
};

const warmedProductDetailHrefs = new Set<string>();

function normalizedInternalProductHref(href: string) {
  if (typeof window === 'undefined') {
    return null;
  }

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

function warmProductDetailHref(href: string, prefetch: (prefetchHref: string) => void) {
  const prefetchHref = normalizedInternalProductHref(href);

  if (!prefetchHref || warmedProductDetailHrefs.has(prefetchHref)) {
    return;
  }

  warmedProductDetailHrefs.add(prefetchHref);
  prefetch(prefetchHref);
}

function isProductLinkPointerTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a[href]'));
}

function ProductCatalogRail({
  activeCategoryIds,
  children,
  nextLabel,
  previousLabel,
}: Readonly<{
  activeCategoryIds: readonly string[];
  children: ReactNode;
  nextLabel: string;
  previousLabel: string;
}>) {
  const [emblaRef, emblaApi] = useEmblaCarousel(productRailOptions);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    didDrag: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
  }>({
    didDrag: false,
    pointerId: null,
    startX: 0,
    startY: 0,
  });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);

  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      emblaRef(node);
    },
    [emblaRef],
  );

  const updateControls = useCallback(() => {
    if (!emblaApi) {
      setCanScrollNext(false);
      setCanScrollPrevious(false);
      return;
    }

    setCanScrollPrevious(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      if (!emblaApi) {
        return;
      }

      emblaApi.scrollTo(emblaApi.selectedScrollSnap() + direction, prefersReducedMotion());
    },
    [emblaApi],
  );

  const finishDrag = useCallback((viewport: HTMLDivElement, pointerId: number) => {
    const dragState = dragStateRef.current;

    if (dragState.pointerId !== pointerId) {
      return;
    }

    if (dragState.didDrag) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragState.pointerId = null;
    dragState.didDrag = false;
    setIsDragging(false);

    if (viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }
  }, []);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if (isProductLinkPointerTarget(event.target)) {
      return;
    }

    const viewport = event.currentTarget;
    dragStateRef.current = {
      didDrag: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDragging(false);
    viewport.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > dragActivationThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      dragState.didDrag = true;
      setIsDragging(true);
    }
  }, []);

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      finishDrag(event.currentTarget, event.pointerId);
    },
    [finishDrag],
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      finishDrag(event.currentTarget, event.pointerId);
    },
    [finishDrag],
  );

  const handleClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }, []);

  useEffect(() => {
    if (!emblaApi) {
      return undefined;
    }

    updateControls();
    emblaApi.on('init', updateControls);
    emblaApi.on('select', updateControls);
    emblaApi.on('settle', updateControls);
    emblaApi.on('reInit', updateControls);
    emblaApi.on('slidesInView', updateControls);

    return () => {
      emblaApi.off('init', updateControls);
      emblaApi.off('select', updateControls);
      emblaApi.off('settle', updateControls);
      emblaApi.off('reInit', updateControls);
      emblaApi.off('slidesInView', updateControls);
    };
  }, [emblaApi, updateControls]);

  useEffect(() => {
    if (!emblaApi || activeCategoryIds.length === 0) {
      return;
    }

    const activeCategories = new Set(activeCategoryIds);
    const targetIndex = emblaApi.slideNodes().findIndex((slide) => {
      const card = slide.matches('[data-catalog-category-id]')
        ? slide
        : slide.querySelector('[data-catalog-category-id]');
      const categoryId = card?.getAttribute('data-catalog-category-id') ?? '';

      return activeCategories.has(categoryId);
    });

    if (targetIndex >= 0) {
      emblaApi.scrollTo(targetIndex, prefersReducedMotion());
    }
  }, [activeCategoryIds, emblaApi]);

  return (
    <div className="official-product-rail-shell">
      <div className="catalog-group-controls" aria-hidden="false">
        <button
          className="catalog-rail-button"
          type="button"
          aria-label={previousLabel}
          disabled={!canScrollPrevious}
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeftIcon className="h-5 w-5 fill-none stroke-current stroke-2" />
        </button>
        <button
          className="catalog-rail-button"
          type="button"
          aria-label={nextLabel}
          disabled={!canScrollNext}
          onClick={() => scrollByPage(1)}
        >
          <ChevronRightIcon className="h-5 w-5 fill-none stroke-current stroke-2" />
        </button>
      </div>
      <div
        ref={setViewportRef}
        className={[
          'official-product-rail-viewport',
          emblaApi ? 'is-carousel-ready' : '',
          isDragging ? 'is-dragging' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-catalog-rail-viewport
        onClickCapture={handleClickCapture}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="official-product-rail" data-catalog-rail>
          {children}
        </div>
      </div>
    </div>
  );
}

function OfficialProductCard({
  active,
  onNavigateStart,
  onWarmIntent,
  pending,
  slot,
}: Readonly<{
  active: boolean;
  onNavigateStart: () => void;
  onWarmIntent: () => void;
  pending: boolean;
  slot: OfficialCatalogSlotView;
}>) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
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

    onWarmIntent();
    onNavigateStart();
  }

  return (
    <article
      id={`catalog-slot-${slot.slotId}`}
      className={[
        'official-product-card',
        active ? 'is-hash-highlight' : '',
        pending ? 'is-navigation-pending' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-busy={pending || undefined}
      data-catalog-category-id={slot.categoryId}
      data-official-catalog-card
    >
      <Link
        className="official-product-link"
        href={slot.href}
        prefetch={false}
        aria-label={`${slot.ctaLabel}: ${slot.title}`}
        draggable={false}
        onClick={handleClick}
        onFocus={onWarmIntent}
        onMouseEnter={onWarmIntent}
        onPointerDown={onWarmIntent}
      >
        <div className="official-product-image">
          {slot.image ? (
            <Image
              src={slot.image}
              alt={slot.title}
              fill
              sizes="(min-width: 1280px) 368px, (min-width: 768px) 340px, 82vw"
              unoptimized={shouldUseUnoptimizedImage(slot.image)}
              draggable={false}
            />
          ) : (
            <span
              className="product-image-empty product-image-empty--catalog"
              aria-label={slot.title}
            >
              <span className="product-image-empty__symbol" aria-hidden="true" />
              <strong>{slot.categoryTitle}</strong>
              <span>{slot.title}</span>
            </span>
          )}
        </div>
        <div className="official-product-body">
          <span className="official-product-category">{slot.groupTitle}</span>
          <h3>{slot.title}</h3>
          <span
            className="official-product-action"
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            {slot.ctaLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}

export function ProductCatalog({
  emptyState,
  groups,
  hashTargets,
  labels,
  overview,
  query,
}: ProductCatalogProps) {
  const router = useRouter();
  const [activeTarget, setActiveTarget] = useState<ActiveCatalogTarget>({
    categoryIds: [],
    groupId: null,
  });
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const warmSlotHref = useCallback(
    (href: string) => {
      warmProductDetailHref(href, (prefetchHref) => router.prefetch(prefetchHref));
    },
    [router],
  );

  const applyHashTarget = useCallback(
    (hash: string, smooth: boolean) => {
      const hashId = decodeHashId(hash);
      const target = hashTargets[hashId];

      if (!target) {
        setActiveTarget({ categoryIds: [], groupId: null });
        return;
      }

      setActiveTarget({
        categoryIds: target.categoryIds,
        groupId: target.groupId,
      });

      window.requestAnimationFrame(() => {
        const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto';
        const root = rootRef.current;
        const section =
          root?.querySelector<HTMLElement>(`[data-catalog-group="${target.groupId}"]`) ??
          document.getElementById(target.groupId);

        section?.scrollIntoView({ behavior, block: 'start' });

        const firstCategoryCard = target.categoryIds.length
          ? Array.from(
              (root ?? document).querySelectorAll<HTMLElement>('[data-catalog-category-id]'),
            ).find((element) => element.dataset.catalogCategoryId === target.categoryIds[0])
          : null;

        firstCategoryCard?.scrollIntoView({
          behavior,
          block: 'nearest',
          inline: 'center',
        });
      });
    },
    [hashTargets],
  );

  useEffect(() => {
    applyHashTarget(window.location.hash, false);

    const handleHashChange = () => applyHashTarget(window.location.hash, true);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [applyHashTarget]);

  return (
    <div ref={rootRef} className="catalog-layout">
      <div className="catalog-main">
        <div className="catalog-overview">
          <div className="catalog-overview-copy">
            <span className="section-tag">{overview.eyebrow}</span>
            <h2>{overview.title}</h2>
            <p>{overview.text}</p>
          </div>
        </div>

        {query?.trim() ? (
          <div className="catalog-query-state">
            {labels.queryPrefix}: <strong>{query}</strong>
          </div>
        ) : null}

        {groups.length > 0 ? (
          <div className="catalog-group-list" aria-label={labels.categoryFilter}>
            {groups.map((group) => {
              const groupActive = activeTarget.groupId === group.id;

              return (
                <section
                  key={group.id}
                  id={group.id}
                  className={['catalog-group-section', groupActive ? 'is-hash-highlight' : '']
                    .filter(Boolean)
                    .join(' ')}
                  data-catalog-group={group.id}
                  aria-labelledby={`catalog-title-${group.id}`}
                >
                  <div className="catalog-group-titlebar">
                    <div>
                      <span className="category-kicker">{labels.coverage}</span>
                      <h2 id={`catalog-title-${group.id}`}>{group.title}</h2>
                    </div>
                    <div className="catalog-group-meta">
                      <span>{group.categorySummary}</span>
                    </div>
                  </div>

                  <ProductCatalogRail
                    activeCategoryIds={groupActive ? activeTarget.categoryIds : []}
                    previousLabel={`${labels.previous} - ${group.title}`}
                    nextLabel={`${labels.next} - ${group.title}`}
                  >
                    {group.slots.map((slot) => (
                      <OfficialProductCard
                        key={slot.slotId}
                        slot={slot}
                        active={activeTarget.categoryIds.includes(slot.categoryId)}
                        onNavigateStart={() => setPendingSlotId(slot.slotId)}
                        onWarmIntent={() => warmSlotHref(slot.href)}
                        pending={pendingSlotId === slot.slotId}
                      />
                    ))}
                  </ProductCatalogRail>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="catalog-empty-state">
            <div>
              <strong>{emptyState.title}</strong>
              <p>{emptyState.text}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
