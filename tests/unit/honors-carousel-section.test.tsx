// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HonorsCarouselSection,
  type HonorCarouselGroup,
} from '@/components/about/HonorsCarouselSection';

const carouselMock = vi.hoisted(() => ({
  render: vi.fn(),
}));

vi.mock('@/components/ui/Carousel', () => ({
  Carousel: (props: { children: React.ReactNode }) => {
    carouselMock.render(props);

    return <div data-testid="honors-carousel">{props.children}</div>;
  },
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

const groups: readonly HonorCarouselGroup[] = [
  {
    id: 'qualification',
    items: [
      {
        id: 'qualification-01',
        src: '/images/about/honors/qualifications/1.jpg',
        title: '国家专精特新小巨人企业',
      },
    ],
    label: '企业资质',
  },
];

function renderHonorsCarousel() {
  return render(
    <HonorsCarouselSection
      ariaLabel="荣誉资质"
      closeLabel="关闭"
      groups={groups}
      previewLabelTemplate="查看 __TITLE__"
    />,
  );
}

afterEach(() => {
  cleanup();
  carouselMock.render.mockClear();
  vi.restoreAllMocks();
});

describe('HonorsCarouselSection', () => {
  it('opens the lightbox on a clean card click', () => {
    renderHonorsCarousel();

    fireEvent.click(screen.getByRole('button', { name: '查看 国家专精特新小巨人企业' }));

    expect(screen.getByRole('dialog', { name: '国家专精特新小巨人企业' })).toBeTruthy();
  });

  it('does not open the lightbox after a drag gesture on an image card', () => {
    renderHonorsCarousel();
    const card = screen.getByRole('button', { name: '查看 国家专精特新小巨人企业' });

    fireEvent.pointerDown(card, {
      button: 0,
      clientX: 120,
      clientY: 80,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(card, {
      clientX: 146,
      clientY: 83,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(card, {
      clientX: 146,
      clientY: 83,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.click(card);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('uses a slower auto-scroll resume so drag gestures can settle before autoplay returns', () => {
    renderHonorsCarousel();

    expect(carouselMock.render).toHaveBeenCalledWith(
      expect.objectContaining({
        autoScroll: expect.objectContaining({
          speed: 0.24,
          startDelay: 1200,
          stopOnInteraction: false,
        }),
        options: expect.objectContaining({
          dragFree: true,
          duration: 28,
        }),
      }),
    );
  });
});
