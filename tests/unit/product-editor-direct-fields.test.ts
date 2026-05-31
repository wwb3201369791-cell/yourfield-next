import { describe, expect, it } from 'vitest';

import {
  buildSectionPropsFromCms,
  buildSectionPropsFromFormValues,
} from '@/lib/content/buildSectionProps';
import type { Product } from '@/lib/product/types';

const t = (key: string) =>
  ({
    'common.requestQuote': '获取报价',
    'common.viewAllProducts': '查看全部产品',
    'page.products.title': '产品中心',
    'product.detail.applications': '适用场景',
    'product.detail.care': '洗护与维护',
    'product.detail.careTag': '维护说明',
    'product.detail.carouselNext': '下一张',
    'product.detail.carouselPrevious': '上一张',
    'product.detail.category': '分类',
    'product.detail.color': '颜色',
    'product.detail.evidenceTag': '资料状态',
    'product.detail.evidenceTitle': '资料与认证状态',
    'product.detail.faq': '常见问题',
    'product.detail.faqTag': 'FAQ',
    'product.detail.features': '产品特点',
    'product.detail.gallery': '产品图册',
    'product.detail.materials': '材料',
    'product.detail.model': '型号',
    'product.detail.navTitle': '目录',
    'product.detail.overview': '概述',
    'product.detail.productIntro': '商品介绍',
    'product.detail.scenarioTag': '使用场景',
    'product.detail.sellingPoints': '核心卖点',
    'product.detail.sellingPointsTag': '产品亮点',
    'product.detail.sizeGuide': '尺码对应表',
    'product.detail.sizeGuideTag': '尺码',
    'product.detail.sizeRange': '尺码范围',
    'product.detail.specTag': '参数',
    'product.detail.specifications': '参数规格',
    'product.detail.standard': '执行标准',
    'product.detail.structure': '结构',
    'product.detail.visualTag': '产品图像',
    'product.detail.visualTitle': '场景图、建模图与模特上身图',
  })[key] ?? key;

const localizedText = (value: string) => ({ zh: value, en: value, ru: value });
const mixedLocalizedText = (zh: string, en = zh, ru = zh) => ({ zh, en, ru });

const enT = (key: string) =>
  ({
    'common.requestQuote': 'Request Quote',
    'common.viewAllProducts': 'View All Products',
    'page.products.title': 'Products Center',
    'product.detail.applications': 'Applications',
    'product.detail.care': 'Care & Maintenance',
    'product.detail.careTag': 'Care',
    'product.detail.carouselNext': 'Next image',
    'product.detail.carouselPrevious': 'Previous image',
    'product.detail.category': 'Category',
    'product.detail.color': 'Color',
    'product.detail.evidenceTag': 'Documents',
    'product.detail.evidenceTitle': 'Materials & Certification Status',
    'product.detail.faq': 'FAQ',
    'product.detail.faqTag': 'FAQ',
    'product.detail.features': 'Key Features',
    'product.detail.gallery': 'Gallery',
    'product.detail.materials': 'Materials',
    'product.detail.model': 'Model',
    'product.detail.navTitle': 'Detail sections',
    'product.detail.overview': 'Overview',
    'product.detail.productIntro': 'Product Introduction',
    'product.detail.scenarioTag': 'Use Cases',
    'product.detail.sellingPoints': 'Core Selling Points',
    'product.detail.sellingPointsTag': 'Highlights',
    'product.detail.sizeGuide': 'Size Guide',
    'product.detail.sizeGuideTag': 'Sizing',
    'product.detail.sizeRange': 'Size range',
    'product.detail.specTag': 'Technical',
    'product.detail.specifications': 'Parameters & Specifications',
    'product.detail.standard': 'Standard',
    'product.detail.structure': 'Structure',
    'product.detail.visualTag': 'Gallery',
    'product.detail.visualTitle': 'Scenes, Modeling Views & Model Wearing Views',
  })[key] ?? key;

describe('product editor direct fields', () => {
  it('does not use the draft slug as the visible product title', () => {
    const detail = buildSectionPropsFromFormValues(
      {
        name: '',
        productId: 'draft-product',
      },
      'zh',
      t,
    );

    expect(detail.productTitle).toBe('');
    expect(detail.sections.hero.productTitle).toBe('');
    expect(detail.sections.hero.productId).toBe('draft-product');
  });

  it('uses populated product group names as the visible category in the visual editor', () => {
    const detail = buildSectionPropsFromFormValues(
      {
        name: '干式水域救援服',
        productGroup: { id: 5, groupId: 'water-rescue', name: '水域救援防护' },
      },
      'zh',
      t,
    );

    expect(detail.productCategory).toBe('水域救援防护');
    expect(detail.sections.hero.productCategory).toBe('水域救援防护');
  });

  it('builds the FAQ section from direct product question and answer rows', () => {
    const detail = buildSectionPropsFromFormValues(
      {
        name: '测试产品',
        productFaqs: [
          {
            question: '这个产品怎么清洗？',
            answer: '使用中性洗涤剂，避免漂白剂。',
          },
        ],
      },
      'zh',
      t,
    );

    expect(detail.sections.faq?.entries).toEqual([
      {
        question: '这个产品怎么清洗？',
        answer: '使用中性洗涤剂，避免漂白剂。',
      },
    ]);
  });

  it('filters untranslated Chinese-only detail rows from English public product details', () => {
    const product: Product = {
      applications: [localizedText('水域救援')],
      careInstructions: [localizedText('低温洗涤')],
      categoryId: 'water-rescue',
      categoryName: mixedLocalizedText('水域救援防护', 'Water Rescue Protection'),
      description: mixedLocalizedText('中文说明', 'Translated water rescue summary.'),
      faqs: [
        {
          question: localizedText('如何清洗？'),
          answer: localizedText('按说明清洗。'),
        },
      ],
      features: [localizedText('隔绝冷水')],
      groupId: 'water-rescue',
      id: 'dry-water-rescue-suit-hyf-9905',
      image: '/images/product.png',
      images: ['/images/product.png'],
      materials: [localizedText('干式水域救援防护材料')],
      model: 'HYF-9905',
      name: mixedLocalizedText('干式水域救援服', 'Dry Water Rescue Suit'),
      qualityEvidence: [
        {
          description: localizedText('厂家有对应检测报告'),
          status: localizedText('有效'),
          title: localizedText('检测报告说明'),
        },
      ],
      scenarios: [{ title: localizedText('水域救援'), text: localizedText('中文应用说明') }],
      sellingPoints: [
        { title: localizedText('隔绝冷水与污水'), text: localizedText('中文卖点说明') },
      ],
      specifications: [
        { label: localizedText('颜色'), value: localizedText('红色') },
        { label: mixedLocalizedText('型号', 'Model'), value: 'HYF-9905' },
      ],
      standards: ['暂无标准'],
      visualGroups: [
        {
          description: localizedText('展示干式水域救援服产品外观、细节与穿着效果。'),
          images: ['/images/detail.png'],
          title: localizedText('产品图册'),
          variant: 'gallery',
        },
      ],
    };

    const detail = buildSectionPropsFromCms(product, 'en', enT);
    const detailText = JSON.stringify(detail.sections);

    expect(detail.productTitle).toBe('Dry Water Rescue Suit');
    expect(detail.productDescription).toBe('Translated water rescue summary.');
    expect(detail.sections.sellingPoints).toBeNull();
    expect(detail.sections.scenarios).toBeNull();
    expect(detail.sections.visualGroups).toBeNull();
    expect(detail.sections.qualityEvidence).toBeNull();
    expect(detail.sections.care).toBeNull();
    expect(detail.sections.faq).toBeNull();
    expect(detail.sections.sidebar?.items.some((item) => item.id === 'faq')).toBe(false);
    expect(detail.sections.specifications?.rows).toEqual([{ label: 'Model', value: 'HYF-9905' }]);
    expect(detailText).not.toMatch(/[\u3400-\u9fff]/u);
  });
});
