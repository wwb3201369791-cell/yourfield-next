 'use client';

import { useFormFields } from 'payload/components/forms';
import { useLocale } from 'payload/components/utilities';
import type { AdminViewProps } from 'payload/config';
import { DefaultCollectionEdit } from 'payload/dist/admin/components/views/collections/Edit/Default/index';
import React, { useMemo, type ComponentType } from 'react';

import { ProductSidebarNav } from '@/components/product-detail/sections/ProductSidebarNav';
import type { Locale } from '@/lib/i18n/locale';

import { CanvasSection } from './CanvasSection';
import { EditorShell } from './EditorShell';
import { registerDrawer } from './SectionDrawer';
import { CareDrawer } from './drawers/CareDrawer';
import { EvidenceDrawer } from './drawers/EvidenceDrawer';
import { FaqDrawer } from './drawers/FaqDrawer';
import { HeroDrawer } from './drawers/HeroDrawer';
import { IntroDrawer } from './drawers/IntroDrawer';
import { OperationsDrawer } from './drawers/OperationsDrawer';
import { ScenariosDrawer } from './drawers/ScenariosDrawer';
import { SellingPointsDrawer } from './drawers/SellingPointsDrawer';
import { SizeGuideDrawer } from './drawers/SizeGuideDrawer';
import { SpecDrawer } from './drawers/SpecDrawer';
import { VisualGroupsDrawer } from './drawers/VisualGroupsDrawer';
import { useSectionPropsFromForm } from './utils/buildProductFromForm';

registerDrawer('hero', HeroDrawer);
registerDrawer('intro', IntroDrawer);
registerDrawer('selling-points', SellingPointsDrawer);
registerDrawer('specifications', SpecDrawer);
registerDrawer('size-guide', SizeGuideDrawer);
registerDrawer('scenarios', ScenariosDrawer);
registerDrawer('visual-groups', VisualGroupsDrawer);
registerDrawer('evidence', EvidenceDrawer);
registerDrawer('care', CareDrawer);
registerDrawer('faq', FaqDrawer);
registerDrawer('operations', OperationsDrawer);

type ProductVisualEditorProps = AdminViewProps;

const DefaultEditView = DefaultCollectionEdit as ComponentType<AdminViewProps>;

const labelMap: Record<string, string> = {
  'common.requestQuote': '获取报价',
  'common.viewAllProducts': '查看全部产品',
  'nav.home': '首页',
  'page.products.title': '产品中心',
  'product.detail.applications': '应用场景',
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
  'product.detail.introTag': '产品概览',
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
  'product.detail.specifications': '规格参数',
  'product.detail.standard': '执行标准',
  'product.detail.structure': '结构',
  'product.detail.visualTag': '产品图像',
  'product.detail.visualTitle': '详情页图组',
};

const t = (key: string) => labelMap[key] ?? key;

function useHasField(path: string) {
  return useFormFields(([fields]) => Boolean(fields[path]?.value));
}

export default function ProductVisualEditor(props: ProductVisualEditorProps) {
  const locale = useLocale();
  const currentLocale = (locale?.code || 'zh') as Locale;
  const detail = useSectionPropsFromForm(currentLocale, t);
  const showClassic = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'classic';
  const hasImages = useHasField('images');
  const navItems = useMemo(
    () =>
      detail.sections.sidebar?.items ?? [
        { id: 'hero', label: '主图与简介' },
        { id: 'product-intro', label: '商品介绍' },
        { id: 'selling-points', label: '核心卖点' },
        { id: 'specifications', label: '规格参数' },
        { id: 'visual-gallery', label: '详情页图组' },
      ],
    [detail.sections.sidebar?.items],
  );

  if (showClassic) {
    return <DefaultEditView {...props} />;
  }

  return (
    <EditorShell
      sidebar={<ProductSidebarNav navTitle="目录" items={navItems} />}
      canvas={
        <div className="ype-product-canvas">
          <CanvasSection id="hero" section="hero" label="主图与简介" isEmpty={!detail.productTitle && !hasImages} emptyHint="产品名称 / 型号 / 主图 / 摘要">
            <article className="ype-preview-card ype-preview-hero">
              <div className="ype-preview-media">
                {/* eslint-disable-next-line @next/next/no-img-element -- Payload admin canvas uses form-state media URLs that are not guaranteed to be Next image-loader compatible. */}
                {detail.mainProductImage ? <img src={detail.mainProductImage} alt="" /> : <span>产品主图</span>}
              </div>
              <div>
                <span className="section-tag">{detail.productCategory || '产品分类'}</span>
                <h1>{detail.productTitle || '未命名产品'}</h1>
                {detail.productDescription ? <p>{detail.productDescription}</p> : <p className="ype-muted">填写产品介绍后会显示在这里。</p>}
              </div>
            </article>
          </CanvasSection>
          <CanvasSection id="product-intro" section="intro" label="商品介绍" isEmpty={!detail.sections.intro} emptyHint="概述 / 材料 / 特点 / 适用场景">
            <article className="ype-preview-card"><h2>商品介绍</h2><p>{detail.sections.intro?.description || '暂无概述'}</p></article>
          </CanvasSection>
          <CanvasSection id="selling-points" section="selling-points" label="核心卖点" isEmpty={!detail.sections.sellingPoints} emptyHint="添加卖点标题和说明">
            <article className="ype-preview-card"><h2>核心卖点</h2><p>{detail.sections.sellingPoints?.points.map((point) => point.title).join(' / ')}</p></article>
          </CanvasSection>
          <CanvasSection id="specifications" section="specifications" label="规格参数" isEmpty={!detail.sections.specifications} emptyHint="添加参数名和值">
            <article className="ype-preview-card"><h2>规格参数</h2><p>{detail.sections.specifications?.rows.length ?? 0} 项参数</p></article>
          </CanvasSection>
          <CanvasSection id="size-guide" section="size-guide" label="尺码对应表" isEmpty={!detail.sections.sizeGuide} emptyHint="添加尺码列和行">
            <article className="ype-preview-card"><h2>尺码对应表</h2><p>{detail.sections.sizeGuide?.columns.join(' / ')}</p></article>
          </CanvasSection>
          <CanvasSection id="application-scenarios" section="scenarios" label="应用场景" isEmpty={!detail.sections.scenarios} emptyHint="添加场景卡片">
            <article className="ype-preview-card"><h2>应用场景</h2><p>{detail.sections.scenarios?.scenarios.map((scenario) => scenario.title).join(' / ')}</p></article>
          </CanvasSection>
          <CanvasSection id="visual-gallery" section="visual-groups" label="详情页图组" isEmpty={!detail.sections.visualGroups} emptyHint="添加场景图 / 建模图 / 模特图">
            <article className="ype-preview-card"><h2>详情页图组</h2><p>{detail.sections.visualGroups?.groups.length ?? 0} 组图片</p></article>
          </CanvasSection>
          <CanvasSection id="quality-evidence" section="evidence" label="资料与认证状态" isEmpty={!detail.sections.qualityEvidence} emptyHint="添加认证和质量证据">
            <article className="ype-preview-card"><h2>资料与认证状态</h2><p>{detail.sections.qualityEvidence?.items.length ?? 0} 条资料</p></article>
          </CanvasSection>
          <CanvasSection id="care-instructions" section="care" label="洗护与维护" isEmpty={!detail.sections.care} emptyHint="添加维护说明">
            <article className="ype-preview-card"><h2>洗护与维护</h2><p>{detail.sections.care?.instructions.join(' / ')}</p></article>
          </CanvasSection>
          <CanvasSection id="faq" section="faq" label="常见问题" isEmpty={!detail.sections.faq} emptyHint="关联 FAQ 条目">
            <article className="ype-preview-card"><h2>常见问题</h2><p>{detail.sections.faq?.entries.length ?? 0} 个问题</p></article>
          </CanvasSection>
        </div>
      }
    />
  );
}
