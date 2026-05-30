// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NewsListRow } from '@/components/news/NewsListRow';
import type { NewsItem } from '@/lib/cms/news';

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

const item: NewsItem = {
  author: 'YourField',
  category: '公司新闻',
  content: [],
  datePublished: '2026-05-20T00:00:00.000Z',
  excerpt: '永霏集团围绕党建引领、安全生产和产业协同开展主题活动。',
  image: '/images/news-placeholder.svg',
  slug: 'party-building-safety-industry',
  title: '党建铸安 赋能产业',
};

describe('NewsListRow', () => {
  afterEach(() => {
    cleanup();
  });

  it('makes the entire news list row one accessible link', () => {
    render(<NewsListRow actionLabel="打开新闻详情" item={item} locale="zh" />);

    const rowLink = screen.getByRole('link', {
      name: '打开新闻详情: 党建铸安 赋能产业',
    });

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(rowLink.getAttribute('href')).toBe('/zh/news/party-building-safety-industry');
    expect(rowLink.classList.contains('news-list-row')).toBe(true);
    expect(within(rowLink).getByText('2026-05-20')).toBeTruthy();
    expect(within(rowLink).getByText('党建铸安 赋能产业')).toBeTruthy();
    expect(
      within(rowLink).getByText('永霏集团围绕党建引领、安全生产和产业协同开展主题活动。'),
    ).toBeTruthy();
  });
});
