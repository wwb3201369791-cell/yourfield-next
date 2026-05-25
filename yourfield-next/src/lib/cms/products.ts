import { unstable_cache } from 'next/cache';
import type { Where } from 'payload/types';
import { cache } from 'react';

import {
  extractedProducts,
  getExtractedProductById,
  hasVisibleProductImage,
} from '@/lib/content/extractedProducts';
import { applyLegacyProductDetailFallback } from '@/lib/content/productLegacyDetails';
import { env } from '@/lib/env';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { locales, type Locale } from '@/lib/i18n/locale';
import type {
  Product,
  ProductDetailCard,
  ProductFaq,
  ProductGroupId,
  ProductQualityEvidence,
  ProductSizeGuide,
  ProductVisualGroup,
} from '@/lib/mock/products';
import type { SiteNavigationItem } from '@/lib/navigation';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag, cmsGlobalCacheTag } from './cache';
import { normalizeCmsMediaUrl } from './media';
import { getCmsNavigation } from './navigation';
import { getPayloadClient } from './payload';

type TextRow = {
  value?: string;
};

type CmsProductGroupDoc = {
  description?: string;
  groupId?: string;
  name?: string;
  order?: number;
  showOnFrontend?: boolean;
};

type CmsCategory = {
  categoryId?: string;
  description?: string;
  group?: string;
  name?: string;
  order?: number;
  productGroup?: CmsProductGroupDoc | number | string;
};

type CmsUpload = {
  alt?: string;
  sizes?: Record<string, { url?: string } | undefined>;
  url?: string;
};

type CmsProductImage = {
  file?: CmsUpload | number | string;
};

type CmsProductVisualGroup = {
  description?: string;
  images?: CmsProductImage[];
  title?: string;
  variant?: string;
};

type CmsProductFeature = {
  description?: string;
  title?: string;
};

type CmsProductSizeGuide = {
  columns?: Array<{ label?: string }>;
  cornerLabel?: string;
  rows?: Array<{
    label?: string;
    values?: Array<{ value?: string }>;
  }>;
  title?: string;
};

type CmsProductQualityEvidence = {
  description?: string;
  status?: string;
  title?: string;
  type?: string;
};

const publishedProductConditions: Where[] = [
  { _status: { equals: 'published' } },
  { publishedAt: { greater_than: '1970-01-01T00:00:00.000Z' } },
];

function publicProductWhere(...conditions: Where[]): Where {
  return {
    and: [...conditions, ...publishedProductConditions],
  };
}

type CmsProductScenario = {
  description?: string;
  title?: string;
};

type CmsProductSellingPoint = {
  text?: string;
  title?: string;
};

type CmsProductSpecification = {
  label?: string;
  value?: string;
};

type CmsFaq = {
  answer?: unknown;
  question?: string;
};

type CmsProduct = {
  applications?: TextRow[];
  careInstructions?: TextRow[];
  category?: CmsCategory | number | string;
  description?: unknown;
  displayOrder?: number;
  features?: CmsProductFeature[];
  images?: CmsProductImage[];
  isFeatured?: boolean;
  materials?: TextRow[];
  model?: string;
  name?: string;
  productGroup?: CmsProductGroupDoc | number | string;
  productId?: string;
  qualityEvidence?: CmsProductQualityEvidence[];
  scenarios?: CmsProductScenario[];
  sellingPoints?: CmsProductSellingPoint[];
  sizeRange?: TextRow[];
  sizeGuide?: CmsProductSizeGuide;
  sku?: string;
  slug?: string;
  faqs?: Array<CmsFaq | number | string>;
  specifications?: CmsProductSpecification[];
  standards?: TextRow[];
  visualGroups?: CmsProductVisualGroup[];
};

export type CmsProductGroup = Readonly<{
  categoryIds: readonly string[];
  id: ProductGroupId;
  order: number;
  title: string;
  description?: string;
}>;

export type CmsProductCategory = Readonly<{
  description: string;
  groupId: ProductGroupId;
  id: string;
  order: number;
  title: string;
}>;

type MappedCmsProduct = Product & {
  productId?: string;
  slug?: string;
};
type PayloadClient = Awaited<ReturnType<typeof getPayloadClient>>;

const fallbackProductImage = '';
const extractedProductCacheVersion = `extracted-products-${extractedProducts.length}-real-images-hyf5506-legacy-detail`;

const productGroupIdList = [
  'fire-rescue',
  'electrical-protection',
  'thermal-welding',
  'chemical-medical',
  'water-rescue',
] as const satisfies readonly ProductGroupId[];

const productGroupTitleKeys: Record<string, string> = {
  'chemical-medical': 'product.group.chemicalMedical',
  'electrical-protection': 'product.group.electrical',
  'fire-rescue': 'product.group.fireRescue',
  'thermal-welding': 'product.group.thermal',
  'water-rescue': 'product.group.waterRescue',
};

export function isCmsProductGroupId(value: unknown): value is ProductGroupId {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function localizedText(value: string) {
  return {
    zh: value,
    en: value,
    ru: value,
  };
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function richTextToPlainText(value: unknown) {
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') {
      return;
    }

    const record = node as Record<string, unknown>;
    if (typeof record.text === 'string') {
      parts.push(record.text);
    }

    if (Array.isArray(record.children)) {
      record.children.forEach(walk);
    }

    if (record.root) {
      walk(record.root);
    }
  }

  walk(value);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function mediaUrl(file: CmsProductImage['file']) {
  if (!file || typeof file !== 'object') {
    return fallbackProductImage;
  }

  return normalizeCmsMediaUrl(file.sizes?.card?.url ?? file.url, fallbackProductImage);
}

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

function groupIdFromCategory(category: CmsCategory | undefined): ProductGroupId {
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
    .filter((row) => row.label && row.values.length > 0);

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

function mapCmsProduct(product: CmsProduct): Product {
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
    images.length > 0 ? images : fallbackImages.length > 0 ? fallbackImages : [fallbackProductImage];
  const sizeGuide = mapSizeGuide(product.sizeGuide);

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
    faqs: mapFaqs(product.faqs),
    careInstructions: mapRows(product.careInstructions).map(localizedText),
    qualityEvidence: mapQualityEvidence(product.qualityEvidence),
    scenarios: mapScenarios(product.scenarios),
    sellingPoints: mapSellingPoints(product.sellingPoints),
    ...(sizeGuide ? { sizeGuide } : {}),
    visualGroups: mapVisualGroups(product.visualGroups),
  };

  return applyLegacyProductDetailFallback(mappedProduct);
}

async function hasCmsProductDocuments(locale: Locale, payloadClient?: PayloadClient) {
  const payload = payloadClient ?? (await getPayloadClient());
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    draft: true,
    fallbackLocale: 'none',
    limit: 1,
    locale,
    overrideAccess: true,
    pagination: false,
  });

  return result.docs.length > 0;
}

async function getCmsProductsUncached(locale: Locale, draft = false) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: '-displayOrder',
    ...(!draft
      ? {
          where: publicProductWhere(),
        }
      : {}),
  });
  const cmsProducts = (result.docs as CmsProduct[]).map(mapCmsProduct);

  if (cmsProducts.length > 0) {
    return cmsProducts;
  }

  if (await hasCmsProductDocuments(locale, payload)) {
    return [];
  }

  return extractedProducts;
}

const getCachedCmsProducts = unstable_cache(
  async (locale: Locale) => getCmsProductsUncached(locale, false),
  ['cms-products', extractedProductCacheVersion],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('products')],
  },
);

function shouldBypassProductCache() {
  return env.NODE_ENV !== 'production' || !env.REVALIDATE_SECRET;
}

export const getCmsProducts = cache(async (locale: Locale, draft = false) => {
  return draft || shouldBypassProductCache()
    ? getCmsProductsUncached(locale, draft)
    : getCachedCmsProducts(locale);
});

function groupIdFromHref(href: string) {
  try {
    const url = new URL(href, 'https://yourfield.local');
    const group = url.searchParams.get('group') || url.hash.replace(/^#/, '');

    return isCmsProductGroupId(group) ? group : null;
  } catch {
    return null;
  }
}

function collectProductGroupLabels(
  items: readonly SiteNavigationItem[],
  labels = new Map<ProductGroupId, string>(),
) {
  for (const item of items) {
    const groupId = groupIdFromHref(item.href);

    if (groupId) {
      labels.set(groupId, item.label);
    }

    if (item.children) {
      collectProductGroupLabels(item.children, labels);
    }
  }

  return labels;
}

function fallbackGroups(locale: Locale): Promise<CmsProductGroup[]> {
  return getTranslations(locale).then((t) =>
    productGroupIdList.map((id, index) => ({
      categoryIds: [],
      id,
      order: index * 10,
      title: t(productGroupTitleKeys[id] ?? id),
    })),
  );
}

function mapCmsCategory(category: CmsCategory): CmsProductCategory | null {
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

async function findProductCategoryDocs(locale: Locale) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'product-categories',
    depth: 2,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: 'order',
  });

  return result.docs as CmsCategory[];
}

async function getCmsProductCategoriesUncached(
  locale: Locale,
): Promise<readonly CmsProductCategory[]> {
  const docs = await findProductCategoryDocs(locale);

  return docs
    .map(mapCmsCategory)
    .filter((category): category is CmsProductCategory => Boolean(category))
    .sort((left, right) => left.order - right.order);
}

const getCachedCmsProductCategories = unstable_cache(
  getCmsProductCategoriesUncached,
  ['cms-product-categories'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('product-categories'), cmsCollectionCacheTag('product-groups')],
  },
);

export const getCmsProductCategories = cache(getCachedCmsProductCategories);

async function getCmsProductGroupsUncached(locale: Locale): Promise<readonly CmsProductGroup[]> {
  const [payload, navigation, fallbackProductGroups] = await Promise.all([
    getPayloadClient(),
    getCmsNavigation(locale),
    fallbackGroups(locale),
  ]);
  const [groupResult, categoryDocs] = await Promise.all([
    payload.find({
      collection: 'product-groups',
      depth: 0,
      fallbackLocale: 'none',
      locale,
      overrideAccess: true,
      pagination: false,
      sort: 'order',
      where: {
        showOnFrontend: {
          not_equals: false,
        },
      },
    }),
    findProductCategoryDocs(locale),
  ]);
  const groupDocs = groupResult.docs as CmsProductGroupDoc[];
  const cmsCategories = categoryDocs
    .map(mapCmsCategory)
    .filter((category): category is CmsProductCategory => Boolean(category));

  if (groupDocs.length > 0) {
    const groups: CmsProductGroup[] = [];

    groupDocs.forEach((group, index) => {
      const id = asString(group.groupId);
      const description = asString(group.description);

      if (!id) {
        return;
      }

      groups.push({
        categoryIds: cmsCategories
          .filter((category) => category.groupId === id)
          .map((category) => category.id),
        id,
        order: group.order ?? index * 10,
        title: asString(group.name, id),
        ...(description ? { description } : {}),
      });
    });

    return groups.sort((left, right) => left.order - right.order);
  }

  const docs = categoryDocs;

  if (docs.length === 0) {
    return fallbackProductGroups;
  }

  const groupLabels = collectProductGroupLabels(navigation.mainNav);
  const groups = new Map<ProductGroupId, { categoryIds: string[]; order: number }>();

  for (const category of docs) {
    const groupId = groupIdFromCategory(category);

    if (!category.categoryId) {
      continue;
    }

    const existing = groups.get(groupId);
    const order = category.order ?? Number.MAX_SAFE_INTEGER;

    if (existing) {
      existing.categoryIds.push(category.categoryId);
      existing.order = Math.min(existing.order, order);
    } else {
      groups.set(groupId, {
        categoryIds: [category.categoryId],
        order,
      });
    }
  }

  if (groups.size === 0) {
    return fallbackProductGroups;
  }

  return Array.from(groups.entries())
    .sort(([, left], [, right]) => left.order - right.order)
    .map(([id, group]) => ({
      categoryIds: group.categoryIds,
      id,
      order: group.order,
      title:
        groupLabels.get(id) ??
        fallbackProductGroups.find((fallbackGroup) => fallbackGroup.id === id)?.title ??
        id,
    }));
}

const getCachedCmsProductGroups = unstable_cache(
  getCmsProductGroupsUncached,
  ['cms-product-groups'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [
      cmsCollectionCacheTag('product-groups'),
      cmsCollectionCacheTag('product-categories'),
      cmsGlobalCacheTag('navigation'),
    ],
  },
);

export const getCmsProductGroups = cache(getCachedCmsProductGroups);

async function getCmsProductBySlugUncached(locale: Locale, slug: string, draft = false) {
  const payload = await getPayloadClient();
  const productLookup: Where = {
    or: [{ slug: { equals: slug } }, { productId: { equals: slug } }],
  };
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    limit: 1,
    locale,
    overrideAccess: true,
    where: draft ? productLookup : publicProductWhere(productLookup),
  });

  const product = result.docs[0] as CmsProduct | undefined;

  if (!product) {
    return (await hasCmsProductDocuments(locale, payload))
      ? null
      : (getExtractedProductById(slug) ?? null);
  }

  const mappedProduct = mapCmsProduct(product);

  return mappedProduct;
}

const getCachedCmsProductBySlug = unstable_cache(
  async (locale: Locale, slug: string) => getCmsProductBySlugUncached(locale, slug, false),
  ['cms-product-by-slug', extractedProductCacheVersion],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('products')],
  },
);

export const getCmsProductBySlug = cache(async (locale: Locale, slug: string, draft = false) => {
  return draft || shouldBypassProductCache()
    ? getCmsProductBySlugUncached(locale, slug, draft)
    : getCachedCmsProductBySlug(locale, slug);
});

async function getFeaturedCmsProductsUncached(locale: Locale, limit = 6, draft = false) {
  const products = await getCmsProductsUncached(locale, draft);
  const productsWithImages = products.filter(hasVisibleProductImage);

  return (productsWithImages.length > 0 ? productsWithImages : products).slice(0, limit);
}

const getCachedFeaturedCmsProducts = unstable_cache(
  async (locale: Locale, limit: number = 6) => getFeaturedCmsProductsUncached(locale, limit, false),
  ['cms-featured-products', extractedProductCacheVersion],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('products')],
  },
);

export const getFeaturedCmsProducts = cache(async (locale: Locale, limit = 6, draft = false) => {
  return draft || shouldBypassProductCache()
    ? getFeaturedCmsProductsUncached(locale, limit, draft)
    : getCachedFeaturedCmsProducts(locale, limit);
});

export async function getCmsProductStaticParams() {
  const products = await getCmsProducts('zh');

  return locales.flatMap((locale) => products.map((product) => ({ locale, slug: product.id })));
}
