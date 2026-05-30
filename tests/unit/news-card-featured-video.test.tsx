// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NewsCard } from '@/components/news/NewsCard';
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

const item: NewsItem = {
  author: 'YourField',
  category: 'Company News',
  content: [],
  datePublished: '2026-05-20T00:00:00.000Z',
  excerpt: 'Featured news summary.',
  image: '/images/news-placeholder.svg',
  slug: 'featured-news',
  title: 'Featured News',
};

afterEach(() => {
  cleanup();
});

describe('NewsCard featured video media', () => {
  it('renders a video as the featured card media when video config is provided', () => {
    const { container } = render(
      <NewsCard
        actionLabel="Open news"
        item={item}
        locale="en"
        videoMedia={{
          label: 'Featured video',
          poster: '/images/headers/news-center.png',
          src: '/video/about.mp4',
        }}
      />,
    );

    const video = container.querySelector('video');
    const source = container.querySelector('video source');

    expect(video).not.toBeNull();
    expect(video?.getAttribute('poster')).toBe('/images/headers/news-center.png');
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(source?.getAttribute('src')).toBe('/video/about.mp4');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link', { name: 'Open news: Featured News' })).toBeTruthy();
  });
});
