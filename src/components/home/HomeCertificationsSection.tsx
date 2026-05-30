'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

export type HomeCertificationItem = Readonly<{
  detail: string;
  icon: string;
  image: string;
  meta: string;
  title: string;
}>;

export type HomeCertificationsSectionProps = Readonly<{
  currentFocusLabel: string;
  description: string;
  items: readonly HomeCertificationItem[];
  matrixAriaLabel: string;
  summaryAriaLabel: string;
  summaryScopes: string;
  summarySince: string;
  summaryStandards: string;
  tag: string;
  title: string;
  visualSystemLabel: string;
}>;

const autoAdvanceDelay = 5200;
const resumeAutoAdvanceDelay = 6800;

function normalizeIndex(index: number, length: number) {
  return (index + length) % length;
}

export function HomeCertificationsSection({
  currentFocusLabel,
  description,
  items,
  matrixAriaLabel,
  summaryAriaLabel,
  summaryScopes,
  summarySince,
  summaryStandards,
  tag,
  title,
  visualSystemLabel,
}: HomeCertificationsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visualChanging, setVisualChanging] = useState(false);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [isFocusInside, setIsFocusInside] = useState(false);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const activeItem = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (!activeItem) {
      return undefined;
    }

    setVisualChanging(true);
    const timeoutId = window.setTimeout(() => setVisualChanging(false), 280);

    return () => window.clearTimeout(timeoutId);
  }, [activeItem]);

  useEffect(() => {
    if (items.length <= 1 || isPointerInside || isFocusInside) {
      return undefined;
    }

    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setActiveIndex((currentIndex) => normalizeIndex(currentIndex + 1, items.length));
      }, autoAdvanceDelay);
    }, resumeAutoAdvanceDelay);

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [isFocusInside, isPointerInside, items.length]);

  const activateItem = useCallback((index: number, shouldFocus: boolean) => {
    setActiveIndex(index);

    if (shouldFocus) {
      window.requestAnimationFrame(() => {
        cardRefs.current[index]?.focus({ preventScroll: true });
      });
    }
  }, []);

  const focusByOffset = useCallback(
    (currentIndex: number, offset: number) => {
      const nextIndex = normalizeIndex(currentIndex + offset, items.length);
      cardRefs.current[nextIndex]?.focus({ preventScroll: true });
      setActiveIndex(nextIndex);
    },
    [items.length],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
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
        const nextIndex = event.key === 'Home' ? 0 : items.length - 1;
        activateItem(nextIndex, true);
      }
    },
    [activateItem, focusByOffset, items.length],
  );

  const handleVisualPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const visual = visualRef.current;

    if (!visual || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    visual.style.setProperty('--cert-image-x', `${(x * 10).toFixed(1)}px`);
    visual.style.setProperty('--cert-image-y', `${(y * 8).toFixed(1)}px`);
  }, []);

  const handleVisualPointerLeave = useCallback(() => {
    const visual = visualRef.current;

    visual?.style.removeProperty('--cert-image-x');
    visual?.style.removeProperty('--cert-image-y');
  }, []);

  if (!activeItem) {
    return null;
  }

  return (
    <section className="certifications" id="certifications" aria-labelledby="certifications-title">
      <div className="container">
        <div
          className="certifications-layout"
          onPointerEnter={() => setIsPointerInside(true)}
          onPointerLeave={() => setIsPointerInside(false)}
          onFocus={() => setIsFocusInside(true)}
          onBlur={(event) => {
            const nextTarget = event.relatedTarget;

            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              setIsFocusInside(false);
            }
          }}
        >
          <div
            ref={visualRef}
            className={['certifications-visual', visualChanging ? 'is-changing' : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
            onPointerMove={handleVisualPointerMove}
            onPointerLeave={handleVisualPointerLeave}
          >
            <Image
              key={activeItem.image}
              src={activeItem.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <span className="certifications-visual__grid" />
            <span className="certifications-visual__scan" />
            <div className="certifications-proof certifications-proof--primary">
              <span>{visualSystemLabel}</span>
              <strong>{activeItem.title}</strong>
            </div>
          </div>

          <div className="certifications-content">
            <div className="certifications-head">
              <span className="section-tag">{tag}</span>
              <h2 id="certifications-title">{title}</h2>
              <p>{description}</p>
            </div>

            <div className="certifications-summary" aria-label={summaryAriaLabel}>
              <span>
                <strong>6</strong>
                <small>{summaryStandards}</small>
              </span>
              <span>
                <strong>6</strong>
                <small>{summaryScopes}</small>
              </span>
              <span>
                <strong>2002</strong>
                <small>{summarySince}</small>
              </span>
            </div>

            <div className="certs-grid" role="group" aria-label={matrixAriaLabel}>
              {items.map((cert, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={cert.title}
                    ref={(element) => {
                      cardRefs.current[index] = element;
                    }}
                    className={['cert-item', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                    type="button"
                    aria-pressed={isActive}
                    aria-describedby="certifications-detail-panel"
                    onClick={() => activateItem(index, false)}
                    onFocus={() => setActiveIndex(index)}
                    onPointerEnter={() => setActiveIndex(index)}
                    onKeyDown={(event) => handleCardKeyDown(event, index)}
                  >
                    <span className="cert-icon">{cert.icon}</span>
                    <span className="cert-item__copy">
                      <strong>{cert.title}</strong>
                      <small>{cert.meta}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="certifications-detail"
              id="certifications-detail-panel"
              aria-live="polite"
            >
              <span>{currentFocusLabel}</span>
              <strong>{activeItem.title}</strong>
              <p>{activeItem.detail}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
