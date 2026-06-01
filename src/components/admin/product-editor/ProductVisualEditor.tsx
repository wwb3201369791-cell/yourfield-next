'use client';

import {
  Form,
  OperationProvider,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useLocale,
} from '@payloadcms/ui';
import type { DocumentViewClientProps } from 'payload';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  buildProductFromFormValues,
  buildSectionPropsFromFormValues,
} from '@/lib/content/buildSectionProps';
import type { Locale } from '@/lib/i18n/locale';

import { useAdminText } from '../adminUiLocale';

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
import { ProductEditorHydrationContext } from './ProductEditorHydrationContext';
import { ProductEditorSidebar } from './ProductEditorSidebar';
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
import { useProductImageArrayUpload } from './hooks/useProductImageArrayUpload';
import { useFormValues } from './utils/buildProductFromForm';
import {
  buildProductDocumentHydrationUrl,
  getProductDocumentIdFromPathname,
  mergeHydratedVisualEditorValues,
  normalizeProductDocumentForFormReset,
} from './utils/productEditorHydration';

registerDrawer('care', CareDrawer);
registerDrawer('evidence', EvidenceDrawer);
registerDrawer('faq', FaqDrawer);
registerDrawer('hero', HeroDrawer);
registerDrawer('identity', OperationsDrawer);
registerDrawer('intro', IntroDrawer);
registerDrawer('scenarios', ScenariosDrawer);
registerDrawer('selling-points', SellingPointsDrawer);
registerDrawer('size-guide', SizeGuideDrawer);
registerDrawer('specifications', SpecDrawer);
registerDrawer('visual-groups', VisualGroupsDrawer);

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

const productLabel = (key: string) => labelMap[key] ?? key;

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
  const adminT = useAdminText();

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
          <strong>{adminT('类别')}</strong>
        </div>
        <InlineProductGroupField value={category} />
      </div>
    </div>
  );
}

function displayOrderInputValue(value: number | string | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? String(value) : '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed && trimmed !== '0' ? trimmed : '';
  }

  return '';
}

function HeroDisplayOrderField() {
  const adminT = useAdminText();
  const { setValue, value } = useField<number | string | undefined>({ path: 'displayOrder' });

  return (
    <label className="ype-hero-order-field" data-ype-path="displayOrder">
      <span>{adminT('大类内展示顺序')}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={displayOrderInputValue(value)}
        placeholder={adminT('未优先排序')}
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          setValue(nextValue ? Number(nextValue) : 0);
        }}
      />
    </label>
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
  const adminT = useAdminText();
  const mainImage = firstFilled(images[0] ?? '');

  return (
    <article className="detail-hero-card ype-detail-hero-card">
      <div className="detail-gallery ype-detail-gallery" aria-label={adminT('产品图片')}>
        <div className="detail-main-image ype-detail-main-image">
          {mainImage ? (
            <button
              type="button"
              className="ype-image-replace-target"
              disabled={uploading}
              aria-label={adminT('替换产品主图')}
              onClick={(event) => stopAndRun(event, onSelectMainImage)}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Payload admin preview reads in-progress media URLs from form state. */}
              <img src={mainImage} alt={title || category || adminT('产品主图')} />
              <span className="ype-image-replace-target__status">{adminT('主图已上传')}</span>
              <span className="ype-image-replace-target__hint">
                {uploading ? adminT('图片上传中…') : adminT('点击替换主图')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="product-image-empty product-image-empty--detail ype-image-add-target"
              disabled={uploading}
              onClick={(event) => stopAndRun(event, onSelectMainImage)}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <strong>{adminT('产品主图')}</strong>
              <span>{uploading ? adminT('图片上传中…') : adminT('点击此区域添加图片')}</span>
            </button>
          )}
        </div>
        <p className="ype-main-image-guidance">
          {adminT(
            '建议 JPG / PNG / WebP / GIF，上传 1600 × 1600 px 的 1:1 方图，主体居中，单图建议不超过 10MB；已有主图时悬浮图片可替换，后台预览使用原图资源并等比完整显示。',
          )}
        </p>
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
            placeholder="产品介绍"
            rows={3}
          />
        </div>
        <AdminHeroFactList category={category} />
        <div className="ype-hero-action-row">
          <div className="detail-actions ype-detail-actions" aria-hidden="true">
            <span className="btn btn-primary btn-large">{adminT('获取报价')}</span>
            <span className="btn btn-secondary btn-large">{adminT('查看全部产品')}</span>
          </div>
          <HeroDisplayOrderField />
        </div>
      </div>
    </article>
  );
}

function useHydratedProductDocument(currentLocale: Locale, formValues: Record<string, unknown>) {
  const {
    config: { routes, serverURL },
  } = useConfig();
  const { id } = useDocumentInfo();
  const { reset } = useForm();
  const [hydratedDoc, setHydratedDoc] = useState<Record<string, unknown> | null>(null);
  const hydratedKeyRef = useRef('');

  useEffect(() => {
    const documentId =
      id && String(id).trim()
        ? String(id)
        : typeof window !== 'undefined'
          ? getProductDocumentIdFromPathname(window.location.pathname)
          : '';

    if (!documentId) {
      setHydratedDoc(null);
      hydratedKeyRef.current = '';
      return undefined;
    }

    const hydrationKey = `${String(documentId)}:${currentLocale}`;
    if (hydratedKeyRef.current === hydrationKey) {
      return undefined;
    }

    hydratedKeyRef.current = hydrationKey;
    const controller = new AbortController();
    const apiBase = `${serverURL ?? ''}${routes.api}`;
    const url = buildProductDocumentHydrationUrl({
      apiBase,
      id: documentId,
      locale: currentLocale,
    });

    void fetch(url, { credentials: 'include', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((doc) => {
        if (!controller.signal.aborted && doc && typeof doc === 'object') {
          const hydratedProduct = doc as Record<string, unknown>;
          setHydratedDoc(hydratedProduct);
          void reset(normalizeProductDocumentForFormReset(hydratedProduct)).catch(() => undefined);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted && hydratedKeyRef.current === hydrationKey) {
          hydratedKeyRef.current = '';
          setHydratedDoc(null);
        }
      });

    return () => controller.abort();
  }, [currentLocale, formValues, id, reset, routes.api, serverURL]);

  return hydratedDoc;
}

function ProductVisualEditorContent() {
  const adminT = useAdminText();
  const locale = useLocale();
  const currentLocale = (locale?.code || 'zh') as Locale;
  const formValues = useFormValues();
  const hydratedDoc = useHydratedProductDocument(currentLocale, formValues);
  const hydratedFormValues = useMemo(
    () => (hydratedDoc ? normalizeProductDocumentForFormReset(hydratedDoc) : null),
    [hydratedDoc],
  );
  const visualValues = mergeHydratedVisualEditorValues(formValues, hydratedDoc);
  const detail = useMemo(
    () => buildSectionPropsFromFormValues(visualValues, currentLocale, productLabel),
    [currentLocale, visualValues],
  );
  const product = useMemo(() => buildProductFromFormValues(visualValues), [visualValues]);
  const productImages = useProductImageArrayUpload('images', { maxRows: 1 });
  const heroImages =
    productImages.imageUrls.length > 0
      ? productImages.imageUrls.slice(0, 1)
      : product.images.length > 0
        ? product.images.slice(0, 1)
        : detail.mainProductImage
          ? [detail.mainProductImage]
          : [];
  return (
    <ProductEditorHydrationContext.Provider value={hydratedFormValues}>
      <EditorShell
        sidebar={
          <ProductEditorSidebar
            formValues={visualValues}
            navTitle="详情目录"
            sections={detail.sections}
          />
        }
        canvas={
          <div className="ype-product-canvas ype-detail-preview">
            <CanvasSection
              id="hero"
              section="hero"
              label={adminT('主图与简介')}
              emptyHint={adminT('产品名称 / 型号 / 主图 / 摘要')}
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
              label={adminT('商品介绍')}
              isEmpty={!detail.sections.intro}
              emptyHint={adminT('概述 / 材料 / 特点 / 适用场景')}
            >
              <InlineProductIntroEditor />
            </CanvasSection>
            <CanvasSection
              id="selling-points"
              section="selling-points"
              label={adminT('核心卖点')}
              isEmpty={!detail.sections.sellingPoints}
              emptyHint={adminT('添加卖点标题和说明')}
            >
              <InlineSellingPointsEditor />
            </CanvasSection>
            <CanvasSection
              id="specifications"
              section="specifications"
              label={adminT('参数规格')}
              isEmpty={!detail.sections.specifications}
              emptyHint={adminT('添加参数名和值')}
            >
              <InlineSpecTableEditor />
            </CanvasSection>
            <CanvasSection
              id="size-guide"
              section="size-guide"
              label={adminT('尺码对应表')}
              isEmpty={!detail.sections.sizeGuide}
              emptyHint={adminT('可选：添加尺码对应表')}
            >
              <InlineSizeGuideEditor />
            </CanvasSection>
            <CanvasSection
              id="application-scenarios"
              section="scenarios"
              label={adminT('适用场景')}
              isEmpty={!detail.sections.scenarios}
              emptyHint={adminT('添加场景标题和说明')}
            >
              <InlineScenariosEditor />
            </CanvasSection>
            <CanvasSection
              id="visual-gallery"
              section="visual-groups"
              label={adminT('场景图、建模图与模特上身图')}
              isEmpty={!detail.sections.visualGroups}
              emptyHint={adminT('添加场景图 / 建模图 / 模特图')}
            >
              <InlineVisualGroupsEditor />
            </CanvasSection>
            <CanvasSection
              id="quality-evidence"
              section="evidence"
              label={adminT('资料与认证状态')}
              isEmpty={!detail.sections.qualityEvidence}
              emptyHint={adminT('添加质量证据和认证状态')}
            >
              <InlineEvidenceEditor />
            </CanvasSection>
            <CanvasSection
              id="care-instructions"
              section="care"
              label={adminT('洗护与维护')}
              isEmpty={!detail.sections.care}
              emptyHint={adminT('添加洗护说明')}
            >
              <InlineCareEditor />
            </CanvasSection>
            <CanvasSection
              id="faq"
              section="faq"
              label={adminT('常见问题')}
              isEmpty={!detail.sections.faq}
              emptyHint={adminT('关联常见问题')}
            >
              <InlineFaqEditor />
            </CanvasSection>
          </div>
        }
      />
    </ProductEditorHydrationContext.Provider>
  );
}

export default function ProductVisualEditor({ formState }: DocumentViewClientProps) {
  const { action, hasSavePermission, id, isInitializing, isTrashed } = useDocumentInfo();
  const operation = id ? 'update' : 'create';

  return (
    <OperationProvider operation={operation}>
      <Form
        {...(action ? { action } : {})}
        {...(!isInitializing && formState ? { initialState: formState } : {})}
        className="ype-document-form"
        disabled={Boolean(isInitializing || !hasSavePermission || isTrashed)}
        isDocumentForm
        isInitializing={isInitializing}
        method={id ? 'PATCH' : 'POST'}
      >
        <ProductVisualEditorContent />
      </Form>
    </OperationProvider>
  );
}
