// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchTrigger } from '@/components/header/SearchTrigger';

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerMocks.push,
  }),
}));

vi.mock('@/lib/i18n/useTranslations', () => ({
  useTranslations: () => (key: string) => key,
}));

function searchResponse(hits: unknown[]) {
  return new Response(
    JSON.stringify({
      facets: { categories: {}, types: { faq: 0, news: 0, page: 0, product: hits.length } },
      hits,
      locale: 'zh',
      ok: true,
      pagination: {
        hasNextPage: false,
        hasPreviousPage: false,
        hitsPerPage: 12,
        page: 1,
        totalPages: hits.length > 0 ? 1 : 0,
      },
      query: '消防员抢险救援服（夏款）',
      tookMs: 1,
      totalHits: hits.length,
      type: 'all',
    }),
    { status: 200 },
  );
}

function renderSearchTrigger(props: Partial<ComponentProps<typeof SearchTrigger>> = {}) {
  render(<SearchTrigger locale="zh" {...props} />);

  return {
    form: document.querySelector('[data-search-form]') as HTMLFormElement,
    input: screen.getByRole('combobox'),
  };
}

describe('SearchTrigger direct navigation', () => {
  beforeEach(() => {
    routerMocks.push.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows hot terms in the header search popup before the visitor starts typing', () => {
    const { input } = renderSearchTrigger({ hotTerms: ['防电弧服', '消防员灭火防护服'] });

    fireEvent.focus(input);

    expect(screen.getByText('防电弧服')).toBeTruthy();
    expect(screen.getByText('消防员灭火防护服')).toBeTruthy();
  });

  it('opens a hot term from the header popup on the search results page', () => {
    const { input } = renderSearchTrigger({ hotTerms: ['防电弧服'] });

    fireEvent.focus(input);
    fireEvent.click(screen.getByRole('option', { name: '防电弧服' }));

    expect(routerMocks.push).toHaveBeenCalledWith('/zh/search?q=%E9%98%B2%E7%94%B5%E5%BC%A7%E6%9C%8D');
  });

  it('opens an exact product match directly from the header search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        searchResponse([
          {
            excerpt: '消防员抢险救援服夏款',
            id: 'product:rescue-suit-summer',
            model: 'HYF-5221',
            score: 300,
            sku: 'HYF-5221',
            title: '消防员抢险救援服（夏款）',
            type: 'product',
            url: '/zh/products/rescue-suit-summer',
          },
        ]),
      ),
    );
    const { form, input } = renderSearchTrigger();

    fireEvent.change(input, { target: { value: '消防员抢险救援服（夏款）' } });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(routerMocks.push).toHaveBeenCalledWith('/zh/products/rescue-suit-summer'),
    );
    expect(String((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain('direct=1');
  });

  it('keeps broad searches on the search results page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        searchResponse([
          {
            excerpt: '消防员抢险救援服夏款',
            id: 'product:rescue-suit-summer',
            model: 'HYF-5221',
            score: 160,
            sku: 'HYF-5221',
            title: '消防员抢险救援服（夏款）',
            type: 'product',
            url: '/zh/products/rescue-suit-summer',
          },
        ]),
      ),
    );
    const { form, input } = renderSearchTrigger();

    fireEvent.change(input, { target: { value: '消防' } });
    fireEvent.submit(form);

    await waitFor(() =>
      expect(routerMocks.push).toHaveBeenCalledWith('/zh/search?q=%E6%B6%88%E9%98%B2'),
    );
  });

  it('opens clear category searches in the matching product center section', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => searchResponse([])),
    );
    const { form, input } = renderSearchTrigger();

    fireEvent.change(input, { target: { value: '消防救援防护' } });
    fireEvent.submit(form);

    await waitFor(() => expect(routerMocks.push).toHaveBeenCalledWith('/zh/products#fire-rescue'));
    expect(String((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain('log=1');
  });
});
