// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AboutSectionNav } from '@/components/about/AboutSectionNav';

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

const sections = [
  { id: 'company-profile', label: '走进我们' },
  { id: 'culture', label: '企业文化' },
  { id: 'honors', label: '荣誉资质' },
] as const;

function rect(top: number, bottom: number): DOMRect {
  return {
    bottom,
    height: bottom - top,
    left: 0,
    right: 100,
    toJSON: () => ({}),
    top,
    width: 100,
    x: 0,
    y: top,
  };
}

function appendTarget(id: string) {
  const target = document.createElement('section');
  target.id = id;
  document.body.append(target);
}

describe('AboutSectionNav', () => {
  let scrollToMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sections.forEach((section) => appendTarget(section.id));
    scrollToMock = vi.fn();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100, writable: true });
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollToMock });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (this.classList.contains('about-section-nav')) {
        return rect(76, 142);
      }
      if (this.id === 'company-profile') {
        return rect(0, 500);
      }
      if (this.id === 'culture') {
        return rect(300, 800);
      }
      if (this.id === 'honors') {
        return rect(900, 1400);
      }

      return rect(0, 0);
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('keeps the clicked section active while smooth scrolling toward it', () => {
    render(
      <AboutSectionNav currentLabel="当前章节" label="关于我们页面分段导航" sections={sections} />,
    );
    const nav = document.querySelector<HTMLElement>('.about-section-nav');
    if (nav) {
      nav.style.top = '76px';
    }

    const honorsLink = screen.getByRole('link', { name: '荣誉资质' });

    fireEvent.click(honorsLink);
    window.dispatchEvent(new Event('scroll'));

    expect(honorsLink.getAttribute('aria-current')).toBe('location');
    expect(scrollToMock).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
        top: 834,
      }),
    );
  });
});
