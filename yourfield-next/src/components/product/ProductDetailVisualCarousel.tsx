'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';

type ProductDetailVisualCarouselProps = Readonly<{
  description?: string;
  images: readonly string[];
  nextLabel: string;
  previousLabel: string;
  title: string;
  variant: string;
}>;

function cleanVariant(value: string) {
  return /^[a-z0-9-]+$/.test(value) ? value : 'gallery';
}

function visibleSlidesForVariant(variant: string, width: number) {
  if (width < 768) {
    return 1;
  }

  if (variant === 'scene' || variant === 'model') {
    return 2;
  }

  if (width < 1180) {
    return 2;
  }

  return 4;
}

function useVisibleSlides(variant: string) {
  const [visibleSlides, setVisibleSlides] = useState(() => visibleSlidesForVariant(variant, 1440));

  useEffect(() => {
    const syncVisibleSlides = () =>
      setVisibleSlides(visibleSlidesForVariant(variant, window.innerWidth));

    syncVisibleSlides();
    window.addEventListener('resize', syncVisibleSlides);

    return () => window.removeEventListener('resize', syncVisibleSlides);
  }, [variant]);

  return visibleSlides;
}

export function ProductDetailVisualCarousel({
  description,
  images,
  nextLabel,
  previousLabel,
  title,
  variant,
}: ProductDetailVisualCarouselProps) {
  const normalizedVariant = cleanVariant(variant);
  const visibleSlides = useVisibleSlides(normalizedVariant);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    duration: 28,
    loop: false,
    watchDrag: true,
  });
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const galleryImages = useMemo(() => images.map((image) => image.trim()).filter(Boolean), [images]);

  const updateCarouselState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setCanScrollNext(emblaApi.canScrollNext());
    setCanScrollPrevious(emblaApi.canScrollPrev());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return undefined;
    }

    updateCarouselState();
    emblaApi.on('select', updateCarouselState);
    emblaApi.on('reInit', updateCarouselState);
    emblaApi.on('slidesInView', updateCarouselState);

    return () => {
      emblaApi.off('select', updateCarouselState);
      emblaApi.off('reInit', updateCarouselState);
      emblaApi.off('slidesInView', updateCarouselState);
    };
  }, [emblaApi, updateCarouselState]);

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

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, visibleSlides]);

  if (galleryImages.length === 0) {
    return null;
  }

  const rangeStart = Math.min(selectedIndex + 1, galleryImages.length);
  const rangeEnd = Math.min(selectedIndex + visibleSlides, galleryImages.length);
  const showControls = galleryImages.length > visibleSlides;

  return (
    <article className={`detail-visual-group detail-visual-group--${normalizedVariant}`}>
      <div className="detail-visual-copy">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div
        className="detail-visual-carousel"
        aria-label={title}
        aria-roledescription="carousel"
        role="region"
      >
        <div className="detail-visual-toolbar">
          <span aria-live="polite">
            {rangeStart}-{rangeEnd} / {galleryImages.length}
          </span>
          {showControls ? (
            <div className="detail-visual-controls">
              <button
                type="button"
                aria-label={previousLabel}
                disabled={!canScrollPrevious}
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeftIcon className="detail-visual-control-icon" />
              </button>
              <button
                type="button"
                aria-label={nextLabel}
                disabled={!canScrollNext}
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRightIcon className="detail-visual-control-icon" />
              </button>
            </div>
          ) : null}
        </div>
        <div
          className={['detail-visual-viewport', isDragging ? 'is-dragging' : ''].join(' ')}
          ref={emblaRef}
        >
          <div className="detail-visual-track">
            {galleryImages.map((image, index) => (
              <a
                key={`${image}-${index}`}
                href={image}
                className="detail-visual-image"
                aria-label={`${title} ${index + 1} / ${galleryImages.length}`}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 1180px) 22vw, (min-width: 768px) 42vw, 88vw"
                  style={{ objectFit: 'contain', padding: '10px' }}
                  unoptimized={shouldUseUnoptimizedImage(image)}
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
