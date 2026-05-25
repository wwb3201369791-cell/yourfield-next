// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProductIntroSection } from '../ProductIntroSection';
import type { IntroSectionProps } from '../types';

afterEach(cleanup);

const baseProps = {
  applications: [],
  applicationsLabel: '适用场景',
  description: '',
  features: [],
  featuresLabel: '产品特点',
  heading: '商品介绍',
  locale: 'zh',
  materials: [],
  materialsLabel: '材料',
  overviewLabel: '概述',
  tagLabel: '产品概览',
} satisfies IntroSectionProps;

describe('<ProductIntroSection />', () => {
  it('renders only the section heading when all optional content is empty', () => {
    render(<ProductIntroSection {...baseProps} />);

    expect(screen.getByText('产品概览')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '商品介绍' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('renders overview, material, feature, and application cards from props', () => {
    render(
      <ProductIntroSection
        {...baseProps}
        applications={['灭火救援']}
        description="产品介绍文案"
        features={['耐磨', '阻燃']}
        materials={['芳纶']}
      />,
    );

    expect(screen.getByRole('heading', { level: 3, name: '概述' })).toBeTruthy();
    expect(screen.getByText('产品介绍文案')).toBeTruthy();
    expect(screen.getByText('芳纶')).toBeTruthy();
    expect(screen.getByText('耐磨')).toBeTruthy();
    expect(screen.getByText('阻燃')).toBeTruthy();
    expect(screen.getByText('灭火救援')).toBeTruthy();
  });
});
