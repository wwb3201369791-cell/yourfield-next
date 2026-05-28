// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AboutShowcase, type AboutShowcaseTheme } from '@/components/about/AboutShowcase';

const emblaMocks = vi.hoisted(() => {
  const listeners = new Map<string, Set<() => void>>();
  let selectedIndex = 0;

  const emit = (event: string) => {
    listeners.get(event)?.forEach((listener) => listener());
  };

  const api = {
    off: vi.fn((event: string, listener: () => void) => {
      listeners.get(event)?.delete(listener);
    }),
    on: vi.fn((event: string, listener: () => void) => {
      const eventListeners = listeners.get(event) ?? new Set<() => void>();
      eventListeners.add(listener);
      listeners.set(event, eventListeners);
    }),
    scrollNext: vi.fn(() => {
      selectedIndex += 1;
      emit('select');
    }),
    scrollPrev: vi.fn(() => {
      selectedIndex = Math.max(0, selectedIndex - 1);
      emit('select');
    }),
    scrollTo: vi.fn((index: number) => {
      selectedIndex = index;
      emit('select');
    }),
    selectedScrollSnap: vi.fn(() => selectedIndex),
  };

  return {
    api,
    options: [] as unknown[],
    ref: vi.fn(),
    reset: () => {
      selectedIndex = 0;
      listeners.clear();
      api.off.mockClear();
      api.on.mockClear();
      api.scrollNext.mockClear();
      api.scrollPrev.mockClear();
      api.scrollTo.mockClear();
      api.selectedScrollSnap.mockClear();
    },
  };
});

vi.mock('embla-carousel-react', () => ({
  default: vi.fn((options: unknown) => {
    emblaMocks.options.push(options);

    return [emblaMocks.ref, emblaMocks.api];
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
  }) => <img alt={alt ?? ''} src={typeof src === 'string' ? src : ''} {...props} />,
}));

const themes: readonly AboutShowcaseTheme[] = [
  {
    body: ['集团说明'],
    caption: '集团图片',
    facts: ['集团事实'],
    images: [
      { alt: '集团图片 1', src: '/images/group-1.jpg' },
      { alt: '集团图片 2', src: '/images/group-2.jpg' },
    ],
    metrics: [{ label: '员工', value: '500+' }],
    theme: '永霏集团',
    title: '集团介绍',
  },
  {
    body: ['医疗说明'],
    caption: '医疗图片',
    facts: ['医疗事实'],
    images: [{ alt: '医疗图片 1', src: '/images/medical-1.jpg' }],
    metrics: [{ label: '产能', value: '1560万套' }],
    theme: '永霏医疗',
    title: '医疗介绍',
  },
];

describe('AboutShowcase', () => {
  beforeEach(() => {
    emblaMocks.options.length = 0;
    emblaMocks.reset();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses the Embla carousel track and keeps a stable gallery when switching themes', async () => {
    const { container } = render(
      <AboutShowcase nextLabel="下一张图片" previousLabel="上一张图片" themes={themes} />,
    );

    await waitFor(() =>
      expect(emblaMocks.options[0]).toMatchObject({
        dragFree: false,
        loop: true,
        watchDrag: true,
      }),
    );

    const galleryBefore = container.querySelector('.about-theme-gallery');
    fireEvent.click(screen.getByRole('button', { name: '永霏医疗' }));

    const galleryAfter = container.querySelector('.about-theme-gallery');
    expect(galleryAfter).toBe(galleryBefore);
    expect(galleryAfter?.getAttribute('data-theme')).toBe('永霏医疗');
    expect(emblaMocks.api.scrollTo).toHaveBeenCalledWith(2);
    expect(screen.getByRole('heading', { name: '医疗介绍' })).toBeTruthy();
  });

  it('delegates arrow navigation to Embla and updates active slide state', async () => {
    const { container } = render(
      <AboutShowcase nextLabel="下一张图片" previousLabel="上一张图片" themes={themes} />,
    );

    await waitFor(() =>
      expect(emblaMocks.api.on).toHaveBeenCalledWith('select', expect.any(Function)),
    );

    fireEvent.click(screen.getByRole('button', { name: '下一张图片' }));

    expect(emblaMocks.api.scrollNext).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '永霏集团 2' }).getAttribute('aria-current')).toBe(
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: '下一张图片' }));

    expect(container.querySelector('.about-theme-gallery')?.getAttribute('data-theme')).toBe(
      '永霏医疗',
    );
  });

  it('scrolls to the matching Embla slide when clicking a gallery dot', async () => {
    render(<AboutShowcase nextLabel="下一张图片" previousLabel="上一张图片" themes={themes} />);

    await waitFor(() => expect(screen.getByRole('button', { name: '永霏集团 2' })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: '永霏集团 2' }));

    expect(emblaMocks.api.scrollTo).toHaveBeenCalledWith(1);
  });
});
