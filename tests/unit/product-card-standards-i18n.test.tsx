// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/lib/product/types';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

const localized = (zh: string, en: string, ru: string) => ({ zh, en, ru });

const product: Product = {
  applications: [],
  categoryId: 'flame-resistant',
  categoryName: localized('阻燃服', 'Flame-Resistant Clothing', 'Огнестойкая одежда'),
  description: localized('中文介绍', 'English description', 'Русское описание'),
  features: [],
  groupId: 'protective-clothing',
  id: 'official-hyf-3105',
  image: '/images/products/example.png',
  images: ['/images/products/example.png'],
  materials: [],
  model: 'HYF-3105',
  name: localized('A级阻燃服', 'Class A Flame-Resistant Clothing', 'Огнестойкая одежда класса A'),
  faqs: [],
  specifications: [],
  standards: [
    'GB8965.1-2020《防护服装阻燃服》',
    '暂无标准',
    'EN11612-2015《防护服防止高温和火焰的服装最低性能要求》',
  ],
};

afterEach(() => {
  cleanup();
});

describe('ProductCard standards display', () => {
  it('keeps Chinese standard names on the Chinese storefront', () => {
    render(<ProductCard detailLabel="查看详情" locale="zh" product={product} />);

    expect(screen.getByText('GB8965.1-2020《防护服装阻燃服》')).toBeTruthy();
    expect(screen.getByText('暂无标准')).toBeTruthy();
  });

  it('removes Han text from shared standard labels on non-Chinese storefronts', () => {
    const { container } = render(
      <ProductCard detailLabel="View details" locale="en" product={product} />,
    );

    expect(screen.getByText('GB8965.1-2020')).toBeTruthy();
    expect(screen.getByText('EN11612-2015')).toBeTruthy();
    expect(container.textContent).not.toMatch(/[\u3400-\u9fff]/u);
    expect(screen.queryByText('暂无标准')).toBeNull();
  });
});
