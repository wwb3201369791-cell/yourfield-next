import { describe, expect, it } from 'vitest';

import { buildSectionPropsFromFormValues } from '@/lib/content/buildSectionProps';

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

describe('product editor direct fields', () => {
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
});
