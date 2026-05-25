'use client';

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

export function AboutShowcase({ nextLabel, previousLabel, themes }: AboutShowcaseProps) {
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeTheme = themes[activeThemeIndex] ?? themes[0];
  const activeImages = useMemo(() => activeTheme?.images ?? [], [activeTheme]);

  const selectTheme = useCallback(
    (index: number) => {
      setIsPaused(true);
      setActiveThemeIndex(normalizeIndex(index, themes.length || 1));
      setActiveImageIndex(0);
    },
    [themes.length],
  );

  const goNext = useCallback(() => {
    const imageCount = activeImages.length || 1;

    if (activeImageIndex < imageCount - 1) {
      setActiveImageIndex(activeImageIndex + 1);
      return;
    }

    setActiveThemeIndex(normalizeIndex(activeThemeIndex + 1, themes.length || 1));
    setActiveImageIndex(0);
  }, [activeImageIndex, activeImages.length, activeThemeIndex, themes.length]);

  const goPrevious = useCallback(() => {
    if (activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
      return;
    }

    const previousThemeIndex = normalizeIndex(activeThemeIndex - 1, themes.length || 1);
    const previousTheme = themes[previousThemeIndex];
    setActiveThemeIndex(previousThemeIndex);
    setActiveImageIndex(Math.max(0, (previousTheme?.images.length ?? 1) - 1));
  }, [activeImageIndex, activeThemeIndex, themes]);

  useEffect(() => {
    if (isPaused || themes.length < 2) {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mediaQuery?.matches) {
      return undefined;
    }

    const timer = window.setInterval(goNext, 4600);

    return () => window.clearInterval(timer);
  }, [goNext, isPaused, themes.length]);

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
          key={activeTheme.theme}
        >
          <div className="about-gallery-viewport">
            <div
              className="about-gallery-track"
              style={{ transform: `translate3d(${-activeImageIndex * 100}%, 0, 0)` }}
            >
              {activeImages.map((image) => (
                <figure key={image.src} className="about-gallery-slide">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill={false}
                    width={720}
                    height={460}
                    sizes="(min-width: 1024px) 44vw, 100vw"
                  />
                </figure>
              ))}
            </div>
            {activeImages.length > 1 ? (
              <>
                <button
                  className="about-gallery-arrow about-gallery-arrow--prev"
                  type="button"
                  aria-label={previousLabel}
                  onClick={goPrevious}
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  className="about-gallery-arrow about-gallery-arrow--next"
                  type="button"
                  aria-label={nextLabel}
                  onClick={goNext}
                >
                  <span aria-hidden="true">›</span>
                </button>
                <div className="about-gallery-dots" aria-label={activeTheme.caption}>
                  {activeImages.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      className={index === activeImageIndex ? 'is-active' : undefined}
                      aria-current={index === activeImageIndex ? 'true' : undefined}
                      aria-label={`${activeTheme.theme} ${index + 1}`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
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
