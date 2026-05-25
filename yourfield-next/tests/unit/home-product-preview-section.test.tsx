// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HomeProductPreviewSection,
  type HomeProductPreviewView,
  type HomeProductScenarioView,
} from '@/components/home/HomeProductPreviewSection';

const routerMocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
}));

const scrollIntoViewMock = vi.fn();

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

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: routerMocks.prefetch,
  }),
}));

const scenarios: HomeProductScenarioView[] = [
  { group: 'fire-rescue', label: '消防救援防护' },
  { group: 'electrical-protection', label: '电气作业防护' },
];

const products: HomeProductPreviewView[] = [
  {
    categoryName: '消防与应急救援防护',
    description: '消防服说明',
    detailHref: '/zh/products/firefighter-suit-combat',
    groupId: 'fire-rescue',
    id: 'firefighter-suit-combat',
    image: '/images/products/official/firefighter-suit-combat-combat-01.png',
    name: '消防员灭火防护服（作战款）',
    viewMoreHref: '/zh/products?group=fire-rescue#fire-rescue',
  },
  {
    categoryName: '电力电弧与电磁防护',
    description: '防电弧说明',
    detailHref: '/zh/products/arc-flash-suit',
    groupId: 'electrical-protection',
    id: 'arc-flash-suit',
    image: '/images/products/official/arc-flash-suit-level-2-jacket-a-01.png',
    name: '防电弧服（夹克款）',
    viewMoreHref: '/zh/products?group=electrical-protection#electrical-protection',
  },
];

function renderPreview() {
  return render(
    <HomeProductPreviewSection
      emptyText="加载中"
      products={products}
      scenarioLabel="核心防护场景"
      scenarios={scenarios}
      viewMoreLabel="查看更多"
    />,
  );
}

describe('HomeProductPreviewSection', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    });
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    scrollIntoViewMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('ok'))),
    );
    routerMocks.prefetch.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('switches the top scenario locally without navigating to the products page', () => {
    renderPreview();

    const electricalScenario = screen.getByRole('link', { name: '电气作业防护' });
    const electricalCard = screen.getByRole('heading', { name: '防电弧服（夹克款）' })
      .closest('article');

    fireEvent.click(electricalScenario);

    expect(electricalScenario.className).toContain('is-active');
    expect(electricalCard?.className).toContain('is-highlighted');
    expect(electricalScenario.getAttribute('href')).toBe('#home-product-electrical-protection');
    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        block: 'nearest',
        inline: 'center',
      }),
    );
    expect(routerMocks.prefetch).not.toHaveBeenCalled();
  });

  it('does not highlight the first product card before scenario interaction', () => {
    renderPreview();

    const firstCard = screen.getByRole('heading', {
      name: '消防员灭火防护服（作战款）',
    }).closest('article');

    expect(firstCard?.className).not.toContain('is-highlighted');
  });

  it('keeps product media on detail while sending view-more links to the product category', async () => {
    renderPreview();

    const detailLinks = screen.getAllByRole('link', {
      name: '查看更多: 消防员灭火防护服（作战款）',
    });
    const viewMoreLink = screen.getByRole('link', {
      name: '查看更多: 消防与应急救援防护',
    });

    expect(detailLinks[0]?.getAttribute('href')).toBe('/zh/products/firefighter-suit-combat');
    expect(viewMoreLink.getAttribute('href')).toBe('/zh/products?group=fire-rescue#fire-rescue');

    fireEvent.mouseEnter(viewMoreLink);

    expect(fetch).toHaveBeenCalledWith('/zh/products?group=fire-rescue', {
      credentials: 'same-origin',
    });
    await waitFor(() =>
      expect(routerMocks.prefetch).toHaveBeenCalledWith('/zh/products?group=fire-rescue'),
    );
  });
});
