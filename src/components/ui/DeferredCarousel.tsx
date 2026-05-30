'use client';

import dynamic from 'next/dynamic';
import { Children, useEffect, useRef, useState } from 'react';

import type { CarouselProps } from '@/components/ui/Carousel';

const ClientCarousel = dynamic(
  () => import('@/components/ui/Carousel').then((module) => module.Carousel),
  { ssr: false },
);

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function DeferredCarousel({
  ariaLabel,
  children,
  className,
  containerClassName,
  slideClassName,
  viewportClassName,
  ...carouselProps
}: CarouselProps) {
  const [shouldLoadCarousel, setShouldLoadCarousel] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const slides = Children.toArray(children);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || shouldLoadCarousel) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      const timeoutId = globalThis.setTimeout(() => setShouldLoadCarousel(true), 1200);

      return () => globalThis.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadCarousel(true);
          observer.disconnect();
        }
      },
      { rootMargin: '720px 0px' },
    );

    observer.observe(root);

    return () => observer.disconnect();
  }, [shouldLoadCarousel]);

  if (shouldLoadCarousel) {
    const clientCarouselProps: CarouselProps = {
      ariaLabel,
      children,
      ...carouselProps,
      ...(className !== undefined ? { className } : {}),
      ...(containerClassName !== undefined ? { containerClassName } : {}),
      ...(slideClassName !== undefined ? { slideClassName } : {}),
      ...(viewportClassName !== undefined ? { viewportClassName } : {}),
    };

    return <ClientCarousel {...clientCarouselProps} />;
  }

  return (
    <div
      ref={rootRef}
      className={cx('yf-carousel', className)}
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      role="region"
    >
      <div className={cx('overflow-hidden', viewportClassName)}>
        <div className={cx('flex overflow-x-auto', containerClassName)}>
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
    </div>
  );
}
