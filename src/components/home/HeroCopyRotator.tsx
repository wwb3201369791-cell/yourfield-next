'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';

export type HeroCopyRotatorSlide = Readonly<{
  title1: string;
  title2: string;
  text: string;
}>;

export type HeroCopyRotatorProps = Readonly<{
  slides: readonly HeroCopyRotatorSlide[];
  intervalMs?: number;
}>;

function safeSetPointerCapture(target: HTMLDivElement, pointerId: number) {
  try {
    target.setPointerCapture?.(pointerId);
  } catch {
    return;
  }
}

function safeReleasePointerCapture(target: HTMLDivElement, pointerId: number) {
  try {
    if (target.hasPointerCapture?.(pointerId)) {
      target.releasePointerCapture?.(pointerId);
    }
  } catch {
    return;
  }
}

export function HeroCopyRotator({ slides, intervalMs = 6000 }: HeroCopyRotatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<number | null>(null);
  const dragRef = useRef({
    didDrag: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
  });

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();

    if (slides.length <= 1) {
      return;
    }

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotionQuery.matches) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
  }, [intervalMs, slides.length, stopAutoPlay]);

  useEffect(() => {
    startAutoPlay();

    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay]);

  const resetDrag = useCallback((target: HTMLDivElement, pointerId: number) => {
    safeReleasePointerCapture(target, pointerId);

    dragRef.current = {
      didDrag: false,
      pointerId: null,
      startX: 0,
      startY: 0,
    };
    setDragOffset(0);
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (slides.length <= 1 || event.button !== 0 || event.isPrimary === false) {
        return;
      }

      stopAutoPlay();
      dragRef.current = {
        didDrag: false,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
      safeSetPointerCapture(event.currentTarget, event.pointerId);
    },
    [slides.length, stopAutoPlay],
  );

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.didDrag && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      drag.didDrag = true;
      setIsDragging(true);
    }

    if (!drag.didDrag) {
      return;
    }

    event.preventDefault();
    setDragOffset(Math.max(-120, Math.min(120, deltaX)));
  }, []);

  const finishDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;

      if (drag.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const shouldChangeSlide =
        drag.didDrag && Math.abs(deltaX) >= 58 && Math.abs(deltaX) > Math.abs(deltaY);

      resetDrag(event.currentTarget, event.pointerId);

      if (shouldChangeSlide) {
        setActiveIndex((current) =>
          deltaX < 0
            ? (current + 1) % slides.length
            : (current - 1 + slides.length) % slides.length,
        );
      }

      startAutoPlay();
    },
    [resetDrag, slides.length, startAutoPlay],
  );

  if (slides.length === 0) {
    return null;
  }

  const dragStyle = isDragging
    ? ({
        '--hero-drag-offset': `${dragOffset}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={[
        'hero-copy-rotator cursor-grab touch-pan-y select-none',
        isDragging ? 'is-dragging cursor-grabbing' : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      style={dragStyle}
      aria-live="polite"
      aria-atomic="true"
      data-hero-copy-rotator
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        const headingClasses = 'hero-slide-heading';

        return (
          <article
            key={index}
            className={['hero-copy-slide', isActive ? 'is-active' : undefined]
              .filter(Boolean)
              .join(' ')}
            aria-hidden={!isActive}
            data-active={isActive ? 'true' : 'false'}
            data-hero-copy-slide
            data-slide-index={index}
          >
            {index === 0 ? (
              <h1 className={headingClasses}>
                <span className="block">{slide.title1}</span>
                <span className="block">{slide.title2}</span>
              </h1>
            ) : (
              <p className={headingClasses} role="heading" aria-level={2}>
                <span className="block">{slide.title1}</span>
                <span className="block">{slide.title2}</span>
              </p>
            )}
            <span className="hero-copy-line" aria-hidden="true" />
            <p className="hero-copy-text">{slide.text}</p>
          </article>
        );
      })}
    </div>
  );
}
