// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HeroCopyRotator, type HeroCopyRotatorSlide } from '@/components/home/HeroCopyRotator';

const slides: readonly HeroCopyRotatorSlide[] = [
  { title1: 'Slide 1', title2: 'First', text: 'First body' },
  { title1: 'Slide 2', title2: 'Second', text: 'Second body' },
  { title1: 'Slide 3', title2: 'Third', text: 'Third body' },
];

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

function activeSlideIndex(container: HTMLElement) {
  const activeSlide = container.querySelector('[data-active="true"]');

  return activeSlide?.getAttribute('data-slide-index');
}

describe('HeroCopyRotator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('advances to the next slide after the configured interval', () => {
    setReducedMotion(false);

    const { container } = render(<HeroCopyRotator slides={slides} intervalMs={6000} />);

    expect(activeSlideIndex(container)).toBe('0');

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(activeSlideIndex(container)).toBe('1');
  });

  it('stays on the first slide when reduced motion is enabled', () => {
    setReducedMotion(true);

    const { container } = render(<HeroCopyRotator slides={slides} intervalMs={6000} />);

    act(() => {
      vi.advanceTimersByTime(18_000);
    });

    expect(activeSlideIndex(container)).toBe('0');
  });

  it('moves to the next slide after a left drag gesture', () => {
    setReducedMotion(false);

    const { container } = render(<HeroCopyRotator slides={slides} intervalMs={6000} />);
    const rotator = container.querySelector('[data-hero-copy-rotator]');

    expect(rotator).toBeInstanceOf(HTMLElement);
    expect(activeSlideIndex(container)).toBe('0');

    act(() => {
      fireEvent.pointerDown(rotator as HTMLElement, {
        button: 0,
        buttons: 1,
        clientX: 240,
        clientY: 120,
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse',
      });
      fireEvent.pointerMove(rotator as HTMLElement, {
        buttons: 1,
        clientX: 150,
        clientY: 124,
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse',
      });
      fireEvent.pointerUp(rotator as HTMLElement, {
        button: 0,
        clientX: 150,
        clientY: 124,
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse',
      });
    });

    expect(activeSlideIndex(container)).toBe('1');
  });
});
