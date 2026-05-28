// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HomeNewsPreviewCard } from '@/components/home/HomeNewsPreviewCard';
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
  category: 'news',
  content: [],
  datePublished: '2026-05-20T00:00:00.000Z',
  excerpt: '永霏集团围绕党建引领、安全生产和产业协同开展主题活动。',
  image: '/images/news-placeholder.svg',
  slug: 'party-building-safety-industry',
  title: '党建铸安 赋能产业',
};

describe('HomeNewsPreviewCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('makes the full homepage news card a single accessible link', () => {
    render(<HomeNewsPreviewCard actionLabel="打开新闻详情" item={item} locale="zh" />);

    const links = screen.getAllByRole('link');
    const cardLink = screen.getByRole('link', {
      name: '打开新闻详情: 党建铸安 赋能产业',
    });

    expect(links).toHaveLength(1);
    expect(cardLink.getAttribute('href')).toBe('/zh/news/party-building-safety-industry');
    expect(within(cardLink).getByText('2026-05-20')).toBeTruthy();
    expect(within(cardLink).getByText('党建铸安 赋能产业')).toBeTruthy();
    expect(
      within(cardLink).getByText('永霏集团围绕党建引领、安全生产和产业协同开展主题活动。'),
    ).toBeTruthy();
  });

  it('shows a sample badge for placeholder news cards', () => {
    render(
      <HomeNewsPreviewCard
        actionLabel="打开新闻详情"
        item={{
          ...item,
          excerpt: '此条为前台版式示例，用于展示新闻卡片、列表和详情页结构。',
          slug: 'sample-news',
          title: '示例：行业目录新闻标题待补充',
        }}
        locale="zh"
      />,
    );

    const cardLink = screen.getByRole('link', {
      name: '打开新闻详情: 示例：行业目录新闻标题待补充',
    });

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(within(cardLink).getByText('示例')).toBeTruthy();
  });
});
