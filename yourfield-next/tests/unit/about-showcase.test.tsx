// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AboutShowcase, type AboutShowcaseTheme } from '@/components/about/AboutShowcase';

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

const themes: readonly AboutShowcaseTheme[] = [
  {
    body: ['集团说明'],
    caption: '集团图片',
    facts: ['集团事实'],
    images: [
      { alt: '集团图片 1', src: '/images/group-1.jpg' },
      { alt: '集团图片 2', src: '/images/group-2.jpg' },
    ],
    metrics: [{ label: '员工', value: '500+' }],
    theme: '永霏集团',
    title: '集团介绍',
  },
  {
    body: ['医疗说明'],
    caption: '医疗图片',
    facts: ['医疗事实'],
    images: [{ alt: '医疗图片 1', src: '/images/medical-1.jpg' }],
    metrics: [{ label: '产能', value: '1560万套' }],
    theme: '永霏医疗',
    title: '医疗介绍',
  },
];

describe('AboutShowcase', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('remounts the image gallery at the first image when switching themes', () => {
    const { container } = render(
      <AboutShowcase nextLabel="下一张图片" previousLabel="上一张图片" themes={themes} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '下一张图片' }));

    const galleryBefore = container.querySelector('.about-theme-gallery');
    expect(container.querySelector<HTMLElement>('.about-gallery-track')?.style.transform).toBe(
      'translate3d(-100%, 0, 0)',
    );

    fireEvent.click(screen.getByRole('button', { name: '永霏医疗' }));

    const galleryAfter = container.querySelector('.about-theme-gallery');
    expect(galleryAfter).not.toBe(galleryBefore);
    expect(galleryAfter?.getAttribute('data-theme')).toBe('永霏医疗');
    expect(container.querySelector<HTMLElement>('.about-gallery-track')?.style.transform).toBe(
      'translate3d(0%, 0, 0)',
    );
  });
});
