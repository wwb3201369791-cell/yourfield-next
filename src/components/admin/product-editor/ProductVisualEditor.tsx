'use client';

import { useLocale } from 'payload/components/utilities';
import type { AdminViewProps } from 'payload/config';
import { DefaultCollectionEdit } from 'payload/dist/admin/components/views/collections/Edit/Default/index';
import React, { type ComponentType } from 'react';

import { ProductSidebarNav } from '@/components/product-detail/sections';
import type { Locale } from '@/lib/i18n/locale';

import { CanvasSection } from './CanvasSection';
import { EditorShell } from './EditorShell';
import {
  InlineCareEditor,
  InlineEvidenceEditor,
  InlineFaqEditor,
  InlineProductGroupField,
  InlineProductIntroEditor,
  InlineScenariosEditor,
  InlineSellingPointsEditor,
  InlineSizeGuideEditor,
  InlineSpecTableEditor,
  InlineStringList,
  InlineTextField,
  InlineVisualGroupsEditor,
} from './InlineDetailEditors';
import { registerDrawer } from './SectionDrawer';
import { OperationsDrawer } from './drawers/OperationsDrawer';
import { useProductImageArrayUpload } from './hooks/useProductImageArrayUpload';
import { productEditorDetailNavItems } from './productEditorSections';
import { useFormProduct, useSectionPropsFromForm } from './utils/buildProductFromForm';

type ProductVisualEditorProps = AdminViewProps;

const DefaultEditView = DefaultCollectionEdit as ComponentType<AdminViewProps>;

registerDrawer('identity', OperationsDrawer);

const labelMap: Record<string, string> = {
  'common.requestQuote': '获取报价',
  'common.viewAllProducts': '查看全部产品',
  'nav.home': '首页',
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
  'product.detail.specifications': '参数规格',
  'product.detail.standard': '执行标准',
  'product.detail.structure': '结构',
  'product.detail.visualTag': '产品图像',
  'product.detail.visualTitle': '场景图、建模图与模特上身图',
};

const t = (key: string) => labelMap[key] ?? key;

function firstFilled(...values: readonly string[]) {
  return values.map((value) => value.trim()).find(Boolean) ?? '';
}

function stopAndRun(event: React.MouseEvent, action: () => void) {
  event.stopPropagation();
  action();
}

function AdminHeroFactList({
  category,
}: Readonly<{
  category: string;
}>) {
  return (
    <div className="ype-admin-fact-grid">
      <div className="ype-admin-fact-card">
        <InlineTextField label="型号" path="model" placeholder="待填写" />
      </div>
      <div className="ype-admin-fact-card">
        <InlineStringList label="执行标准" path="standards" placeholder="例如：GB / XF 标准" />
      </div>
      <div className="ype-admin-fact-card">
        <InlineStringList label="材料" path="materials" placeholder="例如：阻燃面料" />
      </div>
      <div className="ype-admin-fact-card">
        <div className="ype-inline-list-head">
          <strong>类别</strong>
        </div>
        <InlineProductGroupField value={category} />
      </div>
    </div>
  );
}

function AdminHeroPreview({
  category,
  images,
  onSelectMainImage,
  title,
  uploadError,
  uploading,
}: Readonly<{
  category: string;
  images: readonly string[];
  onSelectMainImage: () => void;
  title: string;
  uploadError: string;
  uploading: boolean;
}>) {
  const mainImage = firstFilled(images[0] ?? '');

  return (
    <article className="detail-hero-card ype-detail-hero-card">
      <div className="detail-gallery ype-detail-gallery" aria-label="产品图片">
        <div className="detail-main-image ype-detail-main-image">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- Payload admin preview reads in-progress media URLs from form state.
            <img src={mainImage} alt={title || category || '产品主图'} />
          ) : (
            <button
              type="button"
              className="product-image-empty product-image-empty--detail ype-image-add-target"
              disabled={uploading}
              onClick={(event) => stopAndRun(event, onSelectMainImage)}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <strong>产品主图</strong>
              <span>{uploading ? '图片上传中…' : '点击此区域添加图片'}</span>
            </button>
          )}
        </div>
        {uploadError ? <p className="ype-inline-upload-error">{uploadError}</p> : null}
      </div>

      <div className="detail-summary ype-detail-summary">
        <h1>
          <InlineTextField
            className="ype-inline-field-heading"
            hideLabel
            label="产品名称"
            path="name"
            placeholder={title || '未命名产品'}
          />
        </h1>
        <div className="detail-description ype-hero-description-field">
          <InlineTextField
            className="ype-inline-field-description"
            hideLabel
            label="产品介绍"
            multiline
            path="description"
            placeholder="填写产品介绍后会显示在这里。"
            rows={3}
          />
        </div>
        <AdminHeroFactList category={category} />
        <div className="detail-actions ype-detail-actions" aria-hidden="true">
          <span className="btn btn-primary btn-large">获取报价</span>
          <span className="btn btn-secondary btn-large">查看全部产品</span>
        </div>
      </div>
    </article>
  );
}

export default function ProductVisualEditor(props: ProductVisualEditorProps) {
  const locale = useLocale();
  const currentLocale = (locale?.code || 'zh') as Locale;
  const detail = useSectionPropsFromForm(currentLocale, t);
  const product = useFormProduct(currentLocale);
  const productImages = useProductImageArrayUpload('images', { maxRows: 1 });
  const showClassic =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('view') === 'classic';
  const heroImages =
    productImages.imageUrls.length > 0
      ? productImages.imageUrls.slice(0, 1)
      : product.images.length > 0
        ? product.images.slice(0, 1)
        : detail.mainProductImage
          ? [detail.mainProductImage]
          : [];
  if (showClassic) {
    return <DefaultEditView {...props} />;
  }

  return (
    <EditorShell
      sidebar={<ProductSidebarNav navTitle="详情目录" items={productEditorDetailNavItems} />}
      canvas={
        <div className="ype-product-canvas ype-detail-preview">
          <CanvasSection
            id="hero"
            section="hero"
            label="主图与简介"
            emptyHint="产品名称 / 型号 / 主图 / 摘要"
          >
            <input
              ref={productImages.inputRef}
              className="ype-hidden-file-input"
              type="file"
              accept="image/gif,image/jpeg,image/png,image/webp"
              disabled={productImages.uploading}
              onChange={productImages.onFilesSelected}
            />
            <AdminHeroPreview
              category={detail.productCategory}
              images={heroImages}
              onSelectMainImage={productImages.openFileDialog}
              title={detail.productTitle}
              uploadError={productImages.error}
              uploading={productImages.uploading}
            />
          </CanvasSection>
          <CanvasSection
            id="product-intro"
            section="intro"
            label="商品介绍"
            isEmpty={!detail.sections.intro}
            emptyHint="概述 / 材料 / 特点 / 适用场景"
          >
            <InlineProductIntroEditor />
          </CanvasSection>
          <CanvasSection
            id="selling-points"
            section="selling-points"
            label="核心卖点"
            isEmpty={!detail.sections.sellingPoints}
            emptyHint="添加卖点标题和说明"
          >
            <InlineSellingPointsEditor />
          </CanvasSection>
          <CanvasSection
            id="specifications"
            section="specifications"
            label="参数规格"
            isEmpty={!detail.sections.specifications}
            emptyHint="添加参数名和值"
          >
            <InlineSpecTableEditor />
          </CanvasSection>
          <CanvasSection
            id="size-guide"
            section="size-guide"
            label="尺码对应表"
            isEmpty={!detail.sections.sizeGuide}
            emptyHint="可选：添加尺码对应表"
          >
            <InlineSizeGuideEditor />
          </CanvasSection>
          <CanvasSection
            id="application-scenarios"
            section="scenarios"
            label="适用场景"
            isEmpty={!detail.sections.scenarios}
            emptyHint="添加场景标题和说明"
          >
            <InlineScenariosEditor />
          </CanvasSection>
          <CanvasSection
            id="visual-gallery"
            section="visual-groups"
            label="场景图、建模图与模特上身图"
            isEmpty={!detail.sections.visualGroups}
            emptyHint="添加场景图 / 建模图 / 模特图"
          >
            <InlineVisualGroupsEditor />
          </CanvasSection>
          <CanvasSection
            id="quality-evidence"
            section="evidence"
            label="资料与认证状态"
            isEmpty={!detail.sections.qualityEvidence}
            emptyHint="添加质量证据和认证状态"
          >
            <InlineEvidenceEditor />
          </CanvasSection>
          <CanvasSection
            id="care-instructions"
            section="care"
            label="洗护与维护"
            isEmpty={!detail.sections.care}
            emptyHint="添加洗护说明"
          >
            <InlineCareEditor />
          </CanvasSection>
          <CanvasSection
            id="faq"
            section="faq"
            label="常见问题"
            isEmpty={!detail.sections.faq}
            emptyHint="关联常见问题"
          >
            <InlineFaqEditor />
          </CanvasSection>
        </div>
      }
    />
  );
}
