// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductDetailVisualCarousel } from '@/components/product/ProductDetailVisualCarousel';

const emblaMocks = vi.hoisted(() => {
  const api = {
    canScrollNext: vi.fn(() => true),
    canScrollPrev: vi.fn(() => false),
    off: vi.fn(),
    on: vi.fn(),
    reInit: vi.fn(),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
    selectedScrollSnap: vi.fn(() => 0),
  };

  return {
    api,
    options: [] as unknown[],
    ref: vi.fn(),
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
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    unoptimized?: boolean;
  }) => <img alt={alt ?? ''} src={typeof src === 'string' ? src : ''} {...props} />,
}));

const images = [
  '/images/products/firefighter-protective-suit/modeling-jacket-front.png',
  '/images/products/firefighter-protective-suit/modeling-jacket-back.png',
  '/images/products/firefighter-protective-suit/modeling-jacket-left.png',
  '/images/products/firefighter-protective-suit/modeling-jacket-right.png',
  '/images/products/firefighter-protective-suit/modeling-pants-front.png',
];

describe('ProductDetailVisualCarousel', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    });
    emblaMocks.options.length = 0;
    emblaMocks.api.canScrollNext.mockClear();
    emblaMocks.api.canScrollPrev.mockClear();
    emblaMocks.api.off.mockClear();
    emblaMocks.api.on.mockClear();
    emblaMocks.api.reInit.mockClear();
    emblaMocks.api.scrollNext.mockClear();
    emblaMocks.api.scrollPrev.mockClear();
    emblaMocks.api.selectedScrollSnap.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders product detail images as an Embla carousel with controls', async () => {
    render(
      <ProductDetailVisualCarousel
        description="展示正面、背面及左右侧视图。"
        images={images}
        nextLabel="下一张图片"
        previousLabel="上一张图片"
        title="建模图"
        variant="modeling"
      />,
    );

    expect(screen.getByRole('region', { name: '建模图' })).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(images.length);
    await waitFor(() => expect(screen.getByText('1-4 / 5')).toBeTruthy());
    await waitFor(() => expect(emblaMocks.options[0]).toMatchObject({ containScroll: 'trimSnaps' }));

    fireEvent.click(screen.getByRole('button', { name: '下一张图片' }));

    expect(emblaMocks.api.scrollNext).toHaveBeenCalledTimes(1);
  });
});
