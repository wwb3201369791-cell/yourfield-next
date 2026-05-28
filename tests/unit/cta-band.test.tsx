// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CtaBand } from '@/components/public/CtaBand';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('CtaBand', () => {
  it('renders the unified red CTA with primary and secondary actions', () => {
    render(
      <CtaBand
        title="准备升级员工防护能力？"
        text="联系永霏防护专家，获取贴合行业场景的定制化防护方案。"
        primaryHref="/zh/contact"
        primaryLabel="联系我们"
        secondaryHref="/zh/products"
        secondaryLabel="查看详情"
      />,
    );

    const heading = screen.getByRole('heading', { name: '准备升级员工防护能力？' });
    expect(heading).not.toBeNull();

    const paragraph = screen.getByText('联系永霏防护专家，获取贴合行业场景的定制化防护方案。');
    expect(paragraph).not.toBeNull();

    const primaryLink = screen.getByRole('link', { name: '联系我们' });
    expect(primaryLink.getAttribute('href')).toBe('/zh/contact');

    const secondaryLink = screen.getByRole('link', { name: '查看详情' });
    expect(secondaryLink.getAttribute('href')).toBe('/zh/products');

    const section = primaryLink.closest('section');
    expect(section).not.toBeNull();
    expect(section?.classList.contains('site-cta')).toBe(true);
  });

  it('omits the secondary action when secondary props are missing', () => {
    render(
      <CtaBand
        title="Need a quote?"
        text="Talk to our team."
        primaryHref="/en/contact"
        primaryLabel="Contact Us"
      />,
    );

    expect(screen.getByRole('link', { name: 'Contact Us' }).getAttribute('href')).toBe(
      '/en/contact',
    );
    expect(screen.queryByRole('link', { name: 'View Details' })).toBeNull();
  });
});
