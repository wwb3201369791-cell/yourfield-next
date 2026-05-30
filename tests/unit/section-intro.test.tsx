// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SectionIntro } from '@/components/public/SectionIntro';

describe('SectionIntro', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders section headings with the shared section intro classes', () => {
    render(
      <SectionIntro
        align="left"
        eyebrow="新闻资料"
        title="重点新闻速览"
        text="汇集企业发展、产业协同、荣誉资质与产品应用等信息。"
      />,
    );

    const heading = screen.getByRole('heading', { name: '重点新闻速览' });
    const intro = heading.closest('.section-intro');

    expect(intro).not.toBeNull();
    expect(intro?.classList.contains('section-intro--left')).toBe(true);
    expect(screen.getByText('新闻资料').classList.contains('section-intro__eyebrow')).toBe(true);
    expect(
      screen
        .getByText('汇集企业发展、产业协同、荣誉资质与产品应用等信息。')
        .classList.contains('section-intro__text'),
    ).toBe(true);
  });
});
