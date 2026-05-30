// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ProductDetailLoadingScrollReset,
  ProductDetailScrollReset,
} from '@/components/product/ProductDetailScrollReset';

const navigationMocks = vi.hoisted(() => ({
  pathname: '/zh/products/firefighter-suit-combat',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
}));

describe('ProductDetailScrollReset', () => {
  let scrollY = 0;

  beforeEach(() => {
    scrollY = 0;
    vi.useFakeTimers();
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/zh/products/firefighter-suit-combat');
  });

  it('does not force scrolling when product detail pages already open at the top', () => {
    window.history.replaceState(null, '', '/zh/products/firefighter-suit-combat');
    const initialScrollRestoration = window.history.scrollRestoration;

    render(<ProductDetailScrollReset />);

    expect(window.history.scrollRestoration).toBe(initialScrollRestoration);

    vi.advanceTimersByTime(1200);

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(window.history.scrollRestoration).toBe(initialScrollRestoration);
  });

  it('scrolls product detail pages to the top once if the browser keeps a lower position', () => {
    scrollY = 360;
    window.history.replaceState(null, '', '/zh/products/firefighter-suit-combat');
    const initialScrollRestoration = window.history.scrollRestoration;

    render(<ProductDetailScrollReset />);

    expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 0, behavior: 'auto' });
    expect(window.history.scrollRestoration).toBe(initialScrollRestoration);

    vi.advanceTimersByTime(1200);

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.history.scrollRestoration).toBe(initialScrollRestoration);
  });

  it('does not force a second reset after the loading state already moved to the top', () => {
    scrollY = 360;
    window.history.replaceState(null, '', '/zh/products/firefighter-suit-combat');

    render(<ProductDetailLoadingScrollReset />);

    expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 0, behavior: 'auto' });

    cleanup();
    scrollY = 240;
    render(<ProductDetailScrollReset />);

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('keeps hash navigation untouched', () => {
    window.history.replaceState(null, '', '/zh/products/firefighter-suit-combat#visual-gallery');

    render(<ProductDetailScrollReset />);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
