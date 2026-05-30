// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProductGroupCell, {
  productGroupIdFromValue,
  productGroupLabelFromValue,
} from '@/components/admin/cells/ProductGroupCell';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ id: 4, name: '洁净化学与医疗防护' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }),
    ),
  );
});

describe('ProductGroupCell', () => {
  it('renders an already-expanded product group as an inline cell without Payload relationship markup', () => {
    const { container } = render(
      createElement(ProductGroupCell, {
        rowData: { productGroup: { id: 4, name: '洁净化学与医疗防护' } },
      }),
    );

    expect(screen.getByText('洁净化学与医疗防护')).toBeTruthy();
    expect(container.querySelector('.yf-product-group-cell')?.tagName).toBe('SPAN');
    expect(container.querySelector('.relationship-cell')).toBeNull();
    expect(container.querySelector('div')).toBeNull();
  });

  it('loads the product group label for Payload list rows that only contain the relationship id', async () => {
    render(createElement(ProductGroupCell, { rowData: { productGroup: 4 } }));

    expect(screen.getByText('读取中…')).toBeTruthy();

    await waitFor(() => expect(screen.getByText('洁净化学与医疗防护')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith('/payload-api/product-groups/4?depth=0&locale=zh', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  });

  it('loads the product group through the product row id when Payload omits relationship cellData', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 107,
          productGroup: { id: 4, name: '洁净化学与医疗防护' },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      ),
    );

    render(createElement(ProductGroupCell, { rowData: { id: 107 } }));

    await waitFor(() => expect(screen.getByText('洁净化学与医疗防护')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith('/payload-api/products/107?depth=1&locale=zh', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  });

  it('extracts labels and ids from Payload relationship values', () => {
    expect(productGroupLabelFromValue({ id: 1, name: '电力电弧与电磁防护' })).toBe(
      '电力电弧与电磁防护',
    );
    expect(productGroupLabelFromValue({ id: 2, name: { zh: '消防救援防护' } })).toBe(
      '消防救援防护',
    );
    expect(productGroupIdFromValue({ relationTo: 'product-groups', value: 4 })).toBe('4');
    expect(productGroupIdFromValue(3)).toBe('3');
  });
});
