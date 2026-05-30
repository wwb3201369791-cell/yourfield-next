// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/product/ProductDetailVisualCarousel', () => ({
  ProductDetailVisualCarousel: ({
    description,
    title,
  }: {
    description?: string;
    title: string;
  }) => (
    <article className="detail-visual-group">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </article>
  ),
}));

import { ProductCareInstructions } from '../ProductCareInstructions';
import { ProductFaqList } from '../ProductFaqList';
import { ProductQualityEvidence } from '../ProductQualityEvidence';
import { ProductScenarios } from '../ProductScenarios';
import { ProductSellingPoints } from '../ProductSellingPoints';
import { ProductSidebarNav } from '../ProductSidebarNav';
import { ProductSizeGuideTable } from '../ProductSizeGuideTable';
import { ProductSpecTable } from '../ProductSpecTable';
import { ProductVisualGroups } from '../ProductVisualGroups';

afterEach(cleanup);

describe('product detail extracted sections', () => {
  it('renders selling points from props', () => {
    render(
      <ProductSellingPoints
        heading="核心卖点"
        locale="zh"
        points={[{ title: '阻燃', text: '阻燃说明' }]}
        tagLabel="产品亮点"
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: '核心卖点' })).toBeTruthy();
    expect(screen.getByText('产品亮点')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: '阻燃' })).toBeTruthy();
    expect(screen.getByText('阻燃说明')).toBeTruthy();
  });

  it('renders specification rows and size-guide rows', () => {
    render(
      <>
        <ProductSpecTable
          heading="规格参数"
          locale="zh"
          rows={[{ label: '型号', value: 'X-001' }]}
          tagLabel="参数标签"
        />
        <ProductSizeGuideTable
          columns={['M', 'L']}
          cornerLabel="尺码"
          heading="尺码对应表"
          locale="zh"
          rows={[{ label: '身高', values: ['170', '180'] }]}
          tagLabel="尺码标签"
        />
      </>,
    );

    expect(screen.getByText('参数标签')).toBeTruthy();
    expect(screen.getByText('尺码标签')).toBeTruthy();
    expect(screen.getByText('X-001')).toBeTruthy();
    expect(screen.getByText('170')).toBeTruthy();
    expect(screen.getByText('180')).toBeTruthy();
  });

  it('renders scenario, evidence, care, faq, and sidebar sections', () => {
    render(
      <>
        <ProductScenarios
          heading="应用场景"
          locale="zh"
          scenarios={[{ title: '灭火救援', text: '适用说明' }]}
          tagLabel="场景标签"
        />
        <ProductQualityEvidence
          heading="资料与认证"
          items={[{ description: '证书说明', status: '有效', title: '检测报告' }]}
          locale="zh"
          tagLabel="认证标签"
        />
        <ProductCareInstructions
          heading="洗护"
          instructions={['低温洗涤']}
          locale="zh"
          tagLabel="维护标签"
        />
        <ProductFaqList
          entries={[{ question: '如何清洗？', answer: '按说明清洗。' }]}
          heading="常见问题"
          locale="zh"
          tagLabel="FAQ标签"
        />
        <ProductSidebarNav items={[{ id: 'product-intro', label: '商品介绍' }]} navTitle="目录" />
      </>,
    );

    expect(screen.getByText('场景标签')).toBeTruthy();
    expect(screen.getByText('认证标签')).toBeTruthy();
    expect(screen.getByText('维护标签')).toBeTruthy();
    expect(screen.getByText('FAQ标签')).toBeTruthy();
    expect(screen.getByText('灭火救援')).toBeTruthy();
    expect(screen.getByText('检测报告')).toBeTruthy();
    expect(screen.getByText('低温洗涤')).toBeTruthy();
    expect(screen.getByText('如何清洗？')).toBeTruthy();
    expect(screen.getByRole('link', { name: /商品介绍/ }).getAttribute('href')).toBe(
      '#product-intro',
    );
  });

  it('passes visual group props into the carousel wrapper', () => {
    render(
      <ProductVisualGroups
        carouselNextLabel="下一张"
        carouselPreviousLabel="上一张"
        groups={[
          { description: '场景说明', images: ['/image-a.png'], title: '场景图', variant: 'scene' },
        ]}
        heading="详情图组"
        locale="zh"
        tagLabel="图像标签"
      />,
    );

    expect(screen.getByText('图像标签')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '详情图组' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: '场景图' })).toBeTruthy();
  });
});
