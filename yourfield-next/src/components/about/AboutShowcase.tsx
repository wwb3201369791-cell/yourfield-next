'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

type AboutShowcaseImage = Readonly<{
  alt: string;
  src: string;
}>;

export type AboutShowcaseTheme = Readonly<{
  body: readonly string[];
  caption: string;
  facts: readonly string[];
  images: readonly AboutShowcaseImage[];
  metrics: readonly {
    label: string;
    value: string;
  }[];
  title: string;
  theme: string;
}>;

type AboutShowcaseProps = Readonly<{
  nextLabel: string;
  previousLabel: string;
  themes: readonly AboutShowcaseTheme[];
}>;

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type AboutShowcaseSlide = Readonly<{
  image: AboutShowcaseImage;
  imageIndex: number;
  slideIndex: number;
  themeIndex: number;
}>;

export function AboutShowcase({ nextLabel, previousLabel, themes }: AboutShowcaseProps) {
  const slides = useMemo<readonly AboutShowcaseSlide[]>(() => {
    let slideIndex = 0;

    return themes.flatMap((theme, themeIndex) =>
      theme.images.map((image, imageIndex) => ({
        image,
        imageIndex,
        slideIndex: slideIndex++,
        themeIndex,
      })),
    );
  }, [themes]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: false,
    dragFree: false,
    duration: 20,
    loop: slides.length > 1,
    skipSnaps: false,
    watchDrag: slides.length > 1,
  });

  const selectedSlide = slides[normalizeIndex(selectedSlideIndex, slides.length || 1)];
  const activeThemeIndex = selectedSlide?.themeIndex ?? 0;
  const activeTheme = themes[activeThemeIndex] ?? themes[0];
  const activeImageIndex = selectedSlide?.imageIndex ?? 0;
  const activeImages = useMemo(() => activeTheme?.images ?? [], [activeTheme]);

  const syncCarouselState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setSelectedSlideIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return undefined;
    }

    syncCarouselState();
    emblaApi.on('select', syncCarouselState);
    emblaApi.on('reInit', syncCarouselState);
    emblaApi.on('settle', syncCarouselState);

    return () => {
      emblaApi.off('select', syncCarouselState);
      emblaApi.off('reInit', syncCarouselState);
      emblaApi.off('settle', syncCarouselState);
    };
  }, [emblaApi, syncCarouselState]);

  useEffect(() => {
    if (!emblaApi) {
      return undefined;
    }

    const startDrag = () => {
      setIsPaused(true);
      setIsDragging(true);
    };
    const stopDrag = () => setIsDragging(false);

    emblaApi.on('pointerDown', startDrag);
    emblaApi.on('pointerUp', stopDrag);

    return () => {
      emblaApi.off('pointerDown', startDrag);
      emblaApi.off('pointerUp', stopDrag);
    };
  }, [emblaApi]);

  const scrollToSlide = useCallback(
    (index: number) => {
      if (slides.length === 0) {
        return;
      }

      const nextIndex = normalizeIndex(index, slides.length);
      setIsPaused(true);
      setSelectedSlideIndex(nextIndex);
      emblaApi?.scrollTo(nextIndex);
    },
    [emblaApi, slides.length],
  );

  const selectTheme = useCallback(
    (index: number) => {
      const themeIndex = normalizeIndex(index, themes.length || 1);
      const firstThemeSlide = slides.find((slide) => slide.themeIndex === themeIndex);

      if (!firstThemeSlide) {
        setIsPaused(true);
        return;
      }

      scrollToSlide(firstThemeSlide.slideIndex);
    },
    [scrollToSlide, slides, themes.length],
  );

  const goNext = useCallback(() => {
    if (slides.length <= 1) {
      return;
    }

    if (!emblaApi) {
      setSelectedSlideIndex((index) => normalizeIndex(index + 1, slides.length));
      return;
    }

    emblaApi.scrollNext();
  }, [emblaApi, slides.length]);

  const goPrevious = useCallback(() => {
    if (slides.length <= 1) {
      return;
    }

    if (!emblaApi) {
      setSelectedSlideIndex((index) => normalizeIndex(index - 1, slides.length));
      return;
    }

    emblaApi.scrollPrev();
  }, [emblaApi, slides.length]);

  useEffect(() => {
    if (isPaused || slides.length < 2) {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mediaQuery?.matches) {
      return undefined;
    }

    const timer = window.setInterval(goNext, 4600);

    return () => window.clearInterval(timer);
  }, [goNext, isPaused, slides.length]);

  useEffect(() => {
    if (slides.length > 0 && selectedSlideIndex >= slides.length) {
      setSelectedSlideIndex(0);
      emblaApi?.scrollTo(0);
    }
  }, [emblaApi, selectedSlideIndex, slides.length]);

  if (!activeTheme || themes.length === 0) {
    return null;
  }

  return (
    <div
      className="about-showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="about-showcase__copy">
        <article className="about-showcase__panel is-active" key={activeTheme.theme}>
          <span className="section-tag">{activeTheme.theme}</span>
          <h2>{activeTheme.title}</h2>
          {activeTheme.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul className="about-showcase__facts">
            {activeTheme.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <div className="about-showcase__metrics">
            {activeTheme.metrics.map((metric) => (
              <div key={`${metric.value}-${metric.label}`} className="about-showcase__metric">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="about-showcase__media">
        <div
          className="about-theme-gallery is-active"
          data-theme={activeTheme.theme}
          aria-label={activeTheme.caption}
          aria-roledescription="carousel"
          role="region"
        >
          <div
            className={cx(
              'about-gallery-viewport',
              slides.length > 1 && 'is-draggable',
              isDragging && 'is-dragging',
            )}
            ref={emblaRef}
          >
            <div className="about-gallery-track">
              {slides.map((slide) => {
                const theme = themes[slide.themeIndex];

                return (
                  <figure
                    key={`${theme?.theme ?? slide.themeIndex}-${slide.image.src}`}
                    className="about-gallery-slide"
                    aria-label={`${theme?.theme ?? activeTheme.theme} ${slide.imageIndex + 1}`}
                    aria-roledescription="slide"
                    role="group"
                  >
                    <Image
                      src={slide.image.src}
                      alt={slide.image.alt}
                      fill={false}
                      width={720}
                      height={460}
                      draggable={false}
                      sizes="(min-width: 1024px) 44vw, 100vw"
                    />
                  </figure>
                );
              })}
            </div>
            {slides.length > 1 ? (
              <>
                <button
                  className="about-gallery-arrow about-gallery-arrow--prev"
                  type="button"
                  aria-label={previousLabel}
                  onClick={() => {
                    setIsPaused(true);
                    goPrevious();
                  }}
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  className="about-gallery-arrow about-gallery-arrow--next"
                  type="button"
                  aria-label={nextLabel}
                  onClick={() => {
                    setIsPaused(true);
                    goNext();
                  }}
                >
                  <span aria-hidden="true">›</span>
                </button>
                {activeImages.length > 1 ? (
                  <div className="about-gallery-dots" aria-label={activeTheme.caption}>
                    {activeImages.map((image, index) => (
                      <button
                        key={image.src}
                        type="button"
                        className={index === activeImageIndex ? 'is-active' : undefined}
                        aria-current={index === activeImageIndex ? 'true' : undefined}
                        aria-label={`${activeTheme.theme} ${index + 1}`}
                        onClick={() => {
                          const targetSlide = slides.find(
                            (slide) =>
                              slide.themeIndex === activeThemeIndex && slide.imageIndex === index,
                          );

                          if (targetSlide) {
                            scrollToSlide(targetSlide.slideIndex);
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="about-theme-caption">
            <strong>{activeTheme.theme}</strong>
            <span>{activeTheme.caption}</span>
          </div>
        </div>

        <div className="about-theme-controls" aria-label={activeTheme.title}>
          {themes.map((theme, index) => (
            <button
              className={index === activeThemeIndex ? 'is-active' : undefined}
              key={theme.theme}
              type="button"
              aria-current={index === activeThemeIndex ? 'true' : undefined}
              onClick={() => selectTheme(index)}
            >
              {theme.theme}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
