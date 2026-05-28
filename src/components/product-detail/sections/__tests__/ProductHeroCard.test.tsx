// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProductHeroCard } from '../ProductHeroCard';
import type { HeroSectionProps } from '../types';

afterEach(cleanup);

const baseProps = {
  ctaAllProductsLabel: '查看全部产品',
  ctaQuoteLabel: '获取报价',
  facts: [],
  locale: 'zh',
  mainImage: null,
  productCategory: '',
  productDescription: '',
  productId: 'TEST-001',
  productTitle: '',
  thumbnails: [],
} satisfies HeroSectionProps;

describe('<ProductHeroCard />', () => {
  it('keeps the quote and product-list CTAs visible when content is empty', () => {
    render(<ProductHeroCard {...baseProps} />);

    expect(screen.getByRole('link', { name: '获取报价' }).getAttribute('href')).toBe(
      '/zh/contact?product=TEST-001',
    );
    expect(screen.getByRole('link', { name: '查看全部产品' }).getAttribute('href')).toBe(
      '/zh/products',
    );
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('renders title, category, description, facts, and fallback image text when present', () => {
    render(
      <ProductHeroCard
        {...baseProps}
        facts={[{ label: '型号', value: 'X-001' }]}
        productCategory="示例分类"
        productDescription="示例描述"
        productTitle="示例产品"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: '示例产品' })).toBeTruthy();
    expect(screen.getAllByText('示例分类')).toHaveLength(1);
    expect(screen.getByText('示例描述')).toBeTruthy();
    expect(screen.getByText('型号')).toBeTruthy();
    expect(screen.getByText('X-001')).toBeTruthy();
  });
});
