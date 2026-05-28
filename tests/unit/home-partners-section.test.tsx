// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HomePartnersSection,
  type HomePartnerShowcaseItem,
} from '@/components/home/HomePartnersSection';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    priority,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => (
    <img
      alt={alt ?? ''}
      data-priority={priority ? 'true' : 'false'}
      src={typeof src === 'string' ? src : ''}
      {...props}
    />
  ),
}));

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

const items: HomePartnerShowcaseItem[] = [
  {
    href: '/zh/solutions#industry-petrochemical',
    image: '/images/industries/industry-petrochemical.jpg',
    name: 'PETROCHINA',
    sector: '能源',
    summary: '面向能源与石油石化作业项目。',
    visualTitle: '能源与石油石化',
  },
  {
    href: '/zh/solutions#industry-power',
    image: '/images/industries/industry-power-grid.jpg',
    name: 'STATE GRID',
    sector: '电力电网',
    summary: '服务电力电网检修场景。',
    visualTitle: '电力电网作业',
  },
];

afterEach(() => {
  cleanup();
});

describe('HomePartnersSection', () => {
  it('preloads the main partner visual to avoid a dark empty panel on first scroll', () => {
    const { container } = render(
      <HomePartnersSection
        ariaLabel="合作伙伴案例切换"
        clientsMetric="世界 500 强与国企客户"
        industriesMetric="核心工业应用领域"
        items={items}
        linkLabel="查看相关产品"
        metricsAriaLabel="合作伙伴能力指标"
        projectsMetric="防护项目经验沉淀"
        tag="合作伙伴"
        text="长期服务能源、交通和制造客户。"
        title="全球客户与合作伙伴"
        visualAlt="工业防护应用场景"
      />,
    );

    const visualImage = container.querySelector('.partners-visual img');
    const visualPanel = container.querySelector('.partners-visual');

    expect(visualImage).not.toBeNull();
    expect(visualPanel?.className).not.toContain('is-changing');
    expect(visualImage?.getAttribute('src')).toBe('/images/industries/industry-petrochemical.jpg');
    expect(visualImage?.getAttribute('data-priority')).toBe('true');
  });
});
