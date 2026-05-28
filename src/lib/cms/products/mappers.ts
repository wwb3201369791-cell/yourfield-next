import { getExtractedProductById } from '@/lib/content/extractedProducts';
import { applyLegacyProductDetailFallback } from '@/lib/content/productLegacyDetails';
import type {
  Product,
  ProductDetailCard,
  ProductFaq,
  ProductGroupId,
  ProductQualityEvidence,
  ProductSizeGuide,
  ProductVisualGroup,
} from '@/lib/mock/products';

import { fallbackProductImage } from './constants';
import type {
  CmsCategory,
  CmsFaq,
  CmsProduct,
  CmsProductCategory,
  MappedCmsProduct,
  TextRow,
} from './types';
import {
  asString,
  isCmsProductGroupId,
  localizedText,
  mediaUrl,
  richTextToPlainText,
} from './utils';

function categoryFromProduct(product: CmsProduct) {
  return typeof product.category === 'object' && product.category ? product.category : undefined;
}

function groupFromCategory(category: CmsCategory | undefined) {
  return typeof category?.productGroup === 'object' && category.productGroup
    ? category.productGroup
    : undefined;
}

function groupFromProduct(product: CmsProduct) {
  return typeof product.productGroup === 'object' && product.productGroup
    ? product.productGroup
    : undefined;
}

export function groupIdFromCategory(category: CmsCategory | undefined): ProductGroupId {
  const group = asString(groupFromCategory(category)?.groupId, asString(category?.group));

  return isCmsProductGroupId(group) ? group : 'fire-rescue';
}

function groupIdFromProduct(
  product: CmsProduct,
  category: CmsCategory | undefined,
): ProductGroupId {
  const group = asString(groupFromProduct(product)?.groupId, groupIdFromCategory(category));

  return isCmsProductGroupId(group) ? group : 'fire-rescue';
}

function mapRows(rows: TextRow[] | undefined) {
  return (rows ?? []).map((row) => row.value).filter((value): value is string => Boolean(value));
}

function mapFaqs(faqs: CmsProduct['faqs']): ProductFaq[] {
  return (faqs ?? [])
    .filter((faq): faq is CmsFaq => typeof faq === 'object' && faq !== null)
    .map((faq) => ({
      question: localizedText(asString(faq.question)),
      answer: localizedText(richTextToPlainText(faq.answer)),
    }))
    .filter((faq) => faq.question.zh && faq.answer.zh);
}

function mapProductFaqs(faqs: CmsProduct['productFaqs']): ProductFaq[] {
  return (faqs ?? [])
    .map((faq) => ({
      question: localizedText(asString(faq.question)),
      answer: localizedText(asString(faq.answer)),
    }))
    .filter((faq) => faq.question.zh && faq.answer.zh);
}

function mapVisualGroups(groups: CmsProduct['visualGroups']): ProductVisualGroup[] {
  return (groups ?? [])
    .map((group) => ({
      description: localizedText(asString(group.description)),
      images: (group.images ?? [])
        .map((image) => mediaUrl(image.file))
        .filter((image) => Boolean(image)),
      title: localizedText(asString(group.title)),
      variant: asString(group.variant, 'gallery'),
    }))
    .filter((group) => group.images.length > 0 && group.title.zh);
}

function mapScenarios(scenarios: CmsProduct['scenarios']): ProductDetailCard[] {
  return (scenarios ?? [])
    .map((scenario) => ({
      text: localizedText(asString(scenario.description)),
      title: localizedText(asString(scenario.title)),
    }))
    .filter((scenario) => scenario.title.zh);
}

function mapSellingPoints(points: CmsProduct['sellingPoints']): ProductDetailCard[] {
  return (points ?? [])
    .map((point) => ({
      text: localizedText(asString(point.text)),
      title: localizedText(asString(point.title)),
    }))
    .filter((point) => point.title.zh);
}

function mapQualityEvidence(items: CmsProduct['qualityEvidence']): ProductQualityEvidence[] {
  return (items ?? [])
    .map((item) => ({
      ...(item.type ? { type: item.type } : {}),
      description: localizedText(asString(item.description)),
      status: localizedText(asString(item.status)),
      title: localizedText(asString(item.title)),
    }))
    .filter((item) => item.title.zh);
}

function mapSizeGuide(sizeGuide: CmsProduct['sizeGuide']): ProductSizeGuide | undefined {
  const columns = (sizeGuide?.columns ?? [])
    .map((column) => asString(column.label))
    .filter(Boolean);
  const rows = (sizeGuide?.rows ?? [])
    .map((row) => ({
      label: asString(row.label),
      values: (row.values ?? []).map((value) => asString(value.value)),
    }))
    .filter((row) => row.label && row.values.some(Boolean));

  if (!columns.length || !rows.length) {
    return undefined;
  }

  return {
    ...(sizeGuide?.cornerLabel ? { cornerLabel: localizedText(sizeGuide.cornerLabel) } : {}),
    ...(sizeGuide?.title ? { title: localizedText(sizeGuide.title) } : {}),
    columns,
    rows,
  };
}

export function mapCmsProduct(product: CmsProduct): Product {
  const category = categoryFromProduct(product);
  const group = groupFromProduct(product);
  const groupId = groupIdFromProduct(product, category);
  const hasDirectProductGroup = Boolean(group);
  const productId = asString(product.productId);
  const slug = asString(product.slug);
  const id = productId || slug;
  const name = asString(product.name, id);
  const description = richTextToPlainText(product.description);
  const images = (product.images ?? []).map((image) => mediaUrl(image.file)).filter(Boolean);
  const extractedProduct = getExtractedProductById(id);
  const fallbackImages = extractedProduct?.images.filter(Boolean) ?? [];
  const safeImages =
    images.length > 0
      ? images
      : fallbackImages.length > 0
        ? fallbackImages
        : [fallbackProductImage];
  const sizeGuide = mapSizeGuide(product.sizeGuide);
  const directFaqs = mapProductFaqs(product.productFaqs);

  const mappedProduct: MappedCmsProduct = {
    id,
    ...(productId ? { productId } : {}),
    ...(slug ? { slug } : {}),
    model: asString(product.model, asString(product.sku)),
    ...(product.sku ? { sku: product.sku } : {}),
    categoryId: hasDirectProductGroup ? groupId : asString(category?.categoryId, groupId),
    categoryName: localizedText(
      hasDirectProductGroup
        ? asString(group?.name, groupId)
        : asString(category?.name, asString(group?.name, groupId)),
    ),
    groupId,
    name: localizedText(name),
    description: localizedText(description),
    image: safeImages[0] ?? fallbackProductImage,
    images: safeImages,
    standards: mapRows(product.standards),
    materials: mapRows(product.materials).map(localizedText),
    sizeRange: mapRows(product.sizeRange),
    applications: mapRows(product.applications).map(localizedText),
    features: (product.features ?? [])
      .map((feature) => asString(feature.title, asString(feature.description)))
      .filter(Boolean)
      .map(localizedText),
    specifications: (product.specifications ?? [])
      .filter((specification) => specification.label && specification.value)
      .map((specification) => ({
        label: localizedText(specification.label ?? ''),
        value: localizedText(specification.value ?? ''),
      })),
    faqs: directFaqs.length ? directFaqs : mapFaqs(product.faqs),
    careInstructions: mapRows(product.careInstructions).map(localizedText),
    qualityEvidence: mapQualityEvidence(product.qualityEvidence),
    scenarios: mapScenarios(product.scenarios),
    sellingPoints: mapSellingPoints(product.sellingPoints),
    ...(sizeGuide ? { sizeGuide } : {}),
    visualGroups: mapVisualGroups(product.visualGroups),
  };

  return applyLegacyProductDetailFallback(mappedProduct);
}

function displayOrderSortValue(value: CmsProduct['displayOrder']) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : Number.MAX_SAFE_INTEGER;
}

export function compareCmsProductDisplayOrder(left: CmsProduct, right: CmsProduct) {
  return displayOrderSortValue(left.displayOrder) - displayOrderSortValue(right.displayOrder);
}

export function mapCmsCategory(category: CmsCategory): CmsProductCategory | null {
  const id = asString(category.categoryId);

  if (!id) {
    return null;
  }

  return {
    description: asString(category.description, asString(category.name, id)),
    groupId: groupIdFromCategory(category),
    id,
    order: category.order ?? Number.MAX_SAFE_INTEGER,
    title: asString(category.name, id),
  };
}
