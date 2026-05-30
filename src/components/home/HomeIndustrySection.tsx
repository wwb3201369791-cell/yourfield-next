'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

export type HomeIndustrySlide = Readonly<{
  action: string;
  href: string;
  image: string;
  text: string;
  title: string;
}>;

export type HomeIndustrySectionProps = Readonly<{
  ariaLabel: string;
  slides: readonly HomeIndustrySlide[];
  tag: string;
  title: string;
}>;

type IndustrySectionStyle = CSSProperties & {
  '--industry-bg-image': string;
};

function normalizedIndex(index: number, length: number) {
  return (index + length) % length;
}

function backgroundImageStyle(image: string): IndustrySectionStyle {
  return {
    '--industry-bg-image': `url("${image.replace(/"/g, '%22')}")`,
  };
}

export function HomeIndustrySection({ ariaLabel, slides, tag, title }: HomeIndustrySectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const activeSlide = slides[activeIndex] ?? slides[0];

  const setActive = useCallback(
    (index: number) => {
      if (slides.length === 0) {
        return;
      }

      setActiveIndex(normalizedIndex(index, slides.length));
    },
    [slides.length],
  );

  useEffect(() => {
    if (isPaused || slides.length < 2) {
      return undefined;
    }

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotionQuery.matches) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setActiveIndex((current) => normalizedIndex(current + 1, slides.length));
    }, 4200);

    return () => window.clearInterval(timerId);
  }, [isPaused, slides.length]);

  const handleCarouselBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsPaused(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>, index: number) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
        return;
      }

      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = normalizedIndex(index + direction, slides.length);

      setActive(nextIndex);
      cardRefs.current[nextIndex]?.focus({ preventScroll: true });
    },
    [setActive, slides.length],
  );

  if (!activeSlide) {
    return null;
  }

  return (
    <section
      className="industries"
      id="industry-scenes"
      style={backgroundImageStyle(activeSlide.image)}
    >
      <div className="container">
        <div className="section-header light">
          <span className="section-tag">{tag}</span>
          <h2>{title}</h2>
        </div>
        <div
          className="industries-carousel"
          data-industry-carousel
          aria-label={ariaLabel}
          onBlur={handleCarouselBlur}
          onFocus={() => setIsPaused(true)}
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}
        >
          {slides.map((industry, index) => {
            const isActive = index === activeIndex;

            return (
              <Link
                key={industry.title}
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                className={['industry-card', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                href={industry.href}
                data-industry-slide
                aria-current={isActive ? 'true' : undefined}
                onFocus={() => setActive(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPointerEnter={() => setActive(index)}
              >
                <Image src={industry.image} alt="" fill sizes="(min-width: 768px) 25vw, 100vw" />
                <span className="industry-card__shade" aria-hidden="true" />
                <span className="industry-card__content">
                  <span className="industry-card__title">{industry.title}</span>
                  <span className="industry-card__text">{industry.text}</span>
                  <span className="industry-card__action">{industry.action}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
