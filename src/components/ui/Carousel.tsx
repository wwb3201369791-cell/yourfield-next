'use client';

import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { Children, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';

type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;
type AutoScrollOptions = NonNullable<Parameters<typeof AutoScroll>[0]>;

type CarouselControls = Readonly<{
  previousLabel: string;
  nextLabel: string;
}>;

type CarouselThumbnail = Readonly<{
  alt: string;
  label: string;
  src: string;
}>;

export type CarouselProps = Readonly<{
  ariaLabel: string;
  children: ReactNode;
  autoScroll?: boolean | AutoScrollOptions;
  className?: string;
  containerClassName?: string;
  controls?: CarouselControls;
  counter?: boolean;
  dots?: boolean;
  options?: EmblaOptions;
  slideClassName?: string;
  thumbnails?: readonly CarouselThumbnail[];
  viewportClassName?: string;
}>;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function useCanAutoScroll(enabled: boolean) {
  const [canAutoScroll, setCanAutoScroll] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCanAutoScroll(false);
      return undefined;
    }

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) {
      setCanAutoScroll(true);
      return undefined;
    }

    const syncPreference = () => setCanAutoScroll(!mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);

    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, [enabled]);

  return canAutoScroll;
}

const defaultOptions: EmblaOptions = {
  align: 'start',
  containScroll: 'trimSnaps',
  dragFree: false,
  duration: 28,
  loop: false,
  watchDrag: true,
};

const defaultAutoScrollOptions: AutoScrollOptions = {
  playOnInit: true,
  speed: 0.45,
  startDelay: 900,
  stopOnFocusIn: true,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
};

export function Carousel({
  ariaLabel,
  autoScroll = false,
  children,
  className,
  containerClassName,
  controls,
  counter = false,
  dots = false,
  options,
  slideClassName,
  thumbnails,
  viewportClassName,
}: CarouselProps) {
  const slides = useMemo(() => Children.toArray(children), [children]);
  const canAutoScroll = useCanAutoScroll(Boolean(autoScroll) && slides.length > 1);
  const autoScrollOptions = typeof autoScroll === 'object' ? autoScroll : undefined;
  const plugins = useMemo(
    () =>
      canAutoScroll ? [AutoScroll({ ...defaultAutoScrollOptions, ...autoScrollOptions })] : [],
    [autoScrollOptions, canAutoScroll],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ ...defaultOptions, ...options }, plugins);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollSnaps, setScrollSnaps] = useState<readonly number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const updateState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setCanScrollNext(emblaApi.canScrollNext());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setScrollSnaps(emblaApi.scrollSnapList());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return undefined;
    }

    updateState();
    emblaApi.on('select', updateState);
    emblaApi.on('reInit', updateState);
    emblaApi.on('slidesInView', updateState);

    return () => {
      emblaApi.off('select', updateState);
      emblaApi.off('reInit', updateState);
      emblaApi.off('slidesInView', updateState);
    };
  }, [emblaApi, updateState]);

  useEffect(() => {
    if (!emblaApi) {
      return undefined;
    }

    const startDrag = () => setIsDragging(true);
    const stopDrag = () => setIsDragging(false);

    emblaApi.on('pointerDown', startDrag);
    emblaApi.on('pointerUp', stopDrag);

    return () => {
      emblaApi.off('pointerDown', startDrag);
      emblaApi.off('pointerUp', stopDrag);
    };
  }, [emblaApi]);

  const scrollPrevious = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (slides.length === 0) {
    return null;
  }

  const hasToolbar = controls || counter;

  return (
    <div
      className={cx('yf-carousel', className)}
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      role="region"
    >
      {hasToolbar ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {counter ? (
            <p className="text-sm font-bold text-primary" aria-live="polite">
              {selectedIndex + 1} / {slides.length}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          {controls ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-border bg-white text-primary shadow-sm transition hover:border-primary hover:text-accent disabled:opacity-40"
                type="button"
                aria-label={controls.previousLabel}
                disabled={!canScrollPrev}
                onClick={scrollPrevious}
              >
                <ChevronLeftIcon className="h-5 w-5 fill-none stroke-current stroke-2" />
              </button>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-border bg-white text-primary shadow-sm transition hover:border-primary hover:text-accent disabled:opacity-40"
                type="button"
                aria-label={controls.nextLabel}
                disabled={!canScrollNext}
                onClick={scrollNext}
              >
                <ChevronRightIcon className="h-5 w-5 fill-none stroke-current stroke-2" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cx(
          'overflow-hidden',
          slides.length > 1 && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
          viewportClassName,
        )}
        ref={emblaRef}
      >
        <div className={cx('flex', containerClassName)}>
          {slides.map((slide, index) => (
            <div
              className={cx('min-w-0 flex-[0_0_100%]', slideClassName)}
              key={index}
              aria-label={`${index + 1} / ${slides.length}`}
              aria-roledescription="slide"
              role="group"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {thumbnails && thumbnails.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {thumbnails.slice(0, slides.length).map((thumbnail, index) => (
            <button
              className={cx(
                'relative aspect-square overflow-hidden rounded border bg-white transition',
                index === selectedIndex
                  ? 'border-accent shadow-sm'
                  : 'border-border hover:border-primary',
              )}
              key={`${thumbnail.src}-${index}`}
              type="button"
              aria-current={index === selectedIndex ? 'true' : undefined}
              aria-label={thumbnail.label}
              onClick={() => emblaApi?.scrollTo(index)}
            >
              <Image
                className="h-full w-full object-contain p-3"
                src={thumbnail.src}
                alt={thumbnail.alt}
                fill
                sizes="120px"
                unoptimized={shouldUseUnoptimizedImage(thumbnail.src)}
              />
            </button>
          ))}
        </div>
      ) : null}

      {dots && !thumbnails && scrollSnaps.length > 1 ? (
        <div className="mt-5 flex justify-center gap-2" aria-label={ariaLabel}>
          {scrollSnaps.map((_, index) => (
            <button
              className={cx(
                'h-2.5 rounded-full transition',
                index === selectedIndex
                  ? 'w-8 bg-accent'
                  : 'bg-primary/20 hover:bg-primary/35 w-2.5',
              )}
              key={index}
              type="button"
              aria-current={index === selectedIndex ? 'true' : undefined}
              aria-label={`${ariaLabel} ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
