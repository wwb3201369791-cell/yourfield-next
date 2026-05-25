import { describe, expect, it } from 'vitest';

import type {
  FaqProps,
  HeroSectionProps,
  ProductSectionProps,
  SidebarNavProps,
  VisualGroupsProps,
} from '../types';

const heroProps = {
  ctaAllProductsLabel: '查看全部产品',
  ctaQuoteLabel: '获取报价',
  facts: [{ label: '型号', value: 'HYF-001' }],
  locale: 'zh',
  mainImage: null,
  productCategory: '消防救援防护',
  productDescription: '产品说明',
  productId: 'HYF-001',
  productTitle: '消防员灭火防护服',
  thumbnails: [],
} satisfies HeroSectionProps;

const visualGroupsProps = {
  carouselNextLabel: '下一张',
  carouselPreviousLabel: '上一张',
  groups: [
    {
      description: '场景说明',
      images: ['/images/example.png'],
      title: '场景图',
      variant: 'scene',
    },
  ],
  heading: '详情图组',
  locale: 'zh',
  tagLabel: '产品图像',
} satisfies VisualGroupsProps;

const faqProps = {
  entries: [{ answer: '回答', question: '问题' }],
  heading: '常见问题',
  locale: 'zh',
  tagLabel: 'FAQ',
} satisfies FaqProps;

const sidebarProps = {
  items: [{ id: 'product-intro', label: '商品介绍' }],
  navTitle: '目录',
} satisfies SidebarNavProps;

const renderableSections: ProductSectionProps[] = [heroProps, visualGroupsProps, faqProps];

describe('product detail section prop types', () => {
  it('keeps shared section prop contracts compatible with localized detail data', () => {
    expect(renderableSections).toHaveLength(3);
    expect(sidebarProps.items[0]?.id).toBe('product-intro');
  });
});
