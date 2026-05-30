// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductCatalog, type ProductCatalogGroupView } from '@/components/product/ProductCatalog';

const emblaMocks = vi.hoisted(() => {
  const api = {
    canScrollNext: vi.fn(() => true),
    canScrollPrev: vi.fn(() => false),
    off: vi.fn(),
    on: vi.fn(),
    scrollSnapList: vi.fn(() => [0, 1]),
    scrollTo: vi.fn(),
    selectedScrollSnap: vi.fn(() => 0),
    slideNodes: vi.fn(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-official-catalog-card]')),
    ),
  };

  return {
    api,
    options: [] as unknown[],
    ref: vi.fn(),
  };
});

const routerMocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
}));

vi.mock('embla-carousel-react', () => ({
  default: vi.fn((options: unknown) => {
    emblaMocks.options.push(options);
    return [emblaMocks.ref, emblaMocks.api];
  }),
}));

vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={String(src)} {...props} />
  ),
}));

type MockLinkProps = ComponentProps<'a'> & {
  prefetch?: boolean;
};

vi.mock('next/link', () => ({
  default: ({ children, href, prefetch: _prefetch, ...props }: MockLinkProps) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: routerMocks.prefetch,
  }),
}));

const groups: ProductCatalogGroupView[] = [
  {
    categorySummary: '消防员灭火防护服',
    id: 'fire-rescue',
    slots: [
      {
        categoryDescription: '消防救援防护',
        categoryId: 'firefighter-suit',
        categoryTitle: '消防员灭火防护服',
        ctaLabel: '查看详情',
        detailAvailable: true,
        groupId: 'fire-rescue',
        groupTitle: '消防与应急救援防护',
        href: '/zh/products/firefighter-suit-combat',
        image: '',
        model: 'HYF-5506',
        number: 'NO.01',
        sequence: 1,
        slotId: 'firefighter-suit-combat',
        standards: ['XF10-2014'],
        status: 'published',
        statusLabel: '查看详情',
        title: '消防员灭火防护服（作战款）',
      },
      {
        categoryDescription: '消防抢险救援防护',
        categoryId: 'rescue-suit',
        categoryTitle: '消防员抢险救援服',
        ctaLabel: '查看详情',
        detailAvailable: true,
        groupId: 'fire-rescue',
        groupTitle: '消防与应急救援防护',
        href: '/zh/products/rescue-suit-01',
        image: '',
        model: 'HYF-5507',
        number: 'NO.02',
        sequence: 2,
        slotId: 'rescue-suit-01',
        standards: ['XF633-2006'],
        status: 'published',
        statusLabel: '查看详情',
        title: '消防员抢险救援服 01',
      },
    ],
    title: '消防与应急救援防护',
  },
];

function renderCatalog() {
  render(
    <ProductCatalog
      emptyState={{ text: '暂无产品', title: '暂无产品' }}
      groups={groups}
      hashTargets={{
        'fire-rescue': {
          categoryIds: [],
          groupId: 'fire-rescue',
        },
        'rescue-suit': {
          categoryIds: ['rescue-suit'],
          groupId: 'fire-rescue',
        },
      }}
      labels={{
        categoryFilter: '产品目录',
        coverage: '产品目录',
        next: '下一组',
        previous: '上一组',
        queryPrefix: '搜索结果',
      }}
      overview={{
        eyebrow: '产品资料',
        text: '产品资料',
        title: '产品目录',
      }}
    />,
  );
}

describe('ProductCatalog interactions', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    });

    window.ResizeObserver = vi.fn().mockImplementation(() => ({
      disconnect: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
    }));

    Element.prototype.scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollBy = function scrollBy() {};
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
    window.location.hash = '';
    emblaMocks.options.length = 0;
    emblaMocks.api.canScrollNext.mockClear();
    emblaMocks.api.canScrollPrev.mockClear();
    emblaMocks.api.off.mockClear();
    emblaMocks.api.on.mockClear();
    emblaMocks.api.scrollSnapList.mockClear();
    emblaMocks.api.scrollTo.mockClear();
    emblaMocks.api.selectedScrollSnap.mockClear();
    emblaMocks.api.slideNodes.mockClear();
    routerMocks.prefetch.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps detail links clickable after a small pointer movement', () => {
    renderCatalog();

    const viewport = document.querySelector<HTMLElement>('[data-catalog-rail-viewport]');
    const link = screen.getByRole('link', {
      name: '查看详情: 消防员灭火防护服（作战款）',
    });

    expect(viewport).not.toBeNull();

    fireEvent.pointerDown(viewport as HTMLElement, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(viewport as HTMLElement, {
      clientX: 94,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(viewport as HTMLElement, {
      pointerId: 1,
      pointerType: 'mouse',
    });

    let preventedByRail: boolean | null = null;
    link.addEventListener('click', (event) => {
      preventedByRail = event.defaultPrevented;
      event.preventDefault();
    });

    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(click);

    expect(preventedByRail).toBe(false);
    expect(link.getAttribute('href')).toBe('/zh/products/firefighter-suit-combat');
  });

  it('warms the intended detail page and marks the clicked card as pending', async () => {
    renderCatalog();

    const link = screen.getByRole('link', {
      name: '查看详情: 消防员灭火防护服（作战款）',
    });

    fireEvent.mouseEnter(link);
    await waitFor(() =>
      expect(routerMocks.prefetch).toHaveBeenCalledWith('/zh/products/firefighter-suit-combat'),
    );

    fireEvent.click(link);

    expect(
      document
        .getElementById('catalog-slot-firefighter-suit-combat')
        ?.classList.contains('is-navigation-pending'),
    ).toBe(true);
    expect(link.hasAttribute('prefetch')).toBe(false);
  });

  it('uses the old drag-free carousel rail behavior', async () => {
    renderCatalog();

    await waitFor(() => expect(emblaMocks.options[0]).toMatchObject({ dragFree: true }));

    expect(emblaMocks.options[0]).toMatchObject({
      containScroll: 'trimSnaps',
      duration: 20,
      skipSnaps: true,
      watchDrag: true,
    });
    expect(
      document
        .querySelector('.official-product-rail-viewport')
        ?.classList.contains('is-carousel-ready'),
    ).toBe(true);
  });

  it('moves the carousel rail to the highlighted category from the URL hash', async () => {
    window.location.hash = '#rescue-suit';

    renderCatalog();

    await waitFor(() => expect(emblaMocks.api.scrollTo).toHaveBeenCalledWith(1, false));
  });

  it('puts public anchor ids on catalog group sections', () => {
    renderCatalog();

    expect(document.getElementById('fire-rescue')?.dataset.catalogGroup).toBe('fire-rescue');
    expect(document.getElementById('catalog-group-fire-rescue')).toBeNull();
  });

  it('keeps the visible detail action out of rail drag suppression', () => {
    renderCatalog();

    const action = document.querySelector<HTMLElement>('.official-product-action');
    expect(action).not.toBeNull();

    fireEvent.pointerDown(action as HTMLElement, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(action as HTMLElement, {
      clientX: 78,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(action as HTMLElement, {
      pointerId: 1,
      pointerType: 'mouse',
    });

    const currentAction = document.querySelector<HTMLElement>('.official-product-action');
    let preventedByRail: boolean | null = null;
    document.addEventListener('click', (event) => {
      preventedByRail = event.defaultPrevented;
      event.preventDefault();
    });

    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    currentAction?.dispatchEvent(click);

    expect(preventedByRail).toBe(false);
  });
});
