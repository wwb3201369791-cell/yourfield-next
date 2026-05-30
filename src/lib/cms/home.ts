import type { Locale } from '@/lib/i18n/locale';
import type { Product } from '@/lib/product/types';

import { getCmsProductGroups, getCmsProducts, type CmsProductGroup } from './products';

const homeFeaturedProductLimit = 5;
const hanTextPattern = /[\u3400-\u9fff]/u;
const internalProductLabelPattern = /^official-[a-z0-9-]+$/i;

type HomeProductGroup = Pick<CmsProductGroup, 'id'>;

function localizedProductField(value: Readonly<Record<Locale, string>>, locale: Locale) {
  return value[locale]?.trim() ?? '';
}

function isLocalizedPublicProduct(product: Product, locale: Locale) {
  if (locale === 'zh') {
    return true;
  }

  const visibleFields = [
    localizedProductField(product.name, locale),
    localizedProductField(product.description, locale),
    localizedProductField(product.categoryName, locale),
  ];
  const name = visibleFields[0] ?? '';

  return (
    Boolean(name) &&
    !internalProductLabelPattern.test(name) &&
    !visibleFields.some((value) => hanTextPattern.test(value))
  );
}

function productsForHomeLocale(products: readonly Product[], locale: Locale) {
  return products.filter((product) => isLocalizedPublicProduct(product, locale));
}

function firstProductsByGroup(products: readonly Product[]) {
  const productsByGroup = new Map<string, Product>();

  products.forEach((product) => {
    if (!productsByGroup.has(product.groupId)) {
      productsByGroup.set(product.groupId, product);
    }
  });

  return productsByGroup;
}

function pickFirstProductsFromGroups(
  products: readonly Product[],
  groups: readonly HomeProductGroup[],
) {
  const productsByGroup = firstProductsByGroup(products);
  const selectedProducts: Product[] = [];
  const seenGroupIds = new Set<string>();

  for (const group of groups) {
    if (seenGroupIds.has(group.id)) {
      continue;
    }

    seenGroupIds.add(group.id);

    const product = productsByGroup.get(group.id);

    if (!product) {
      continue;
    }

    selectedProducts.push(product);

    if (selectedProducts.length >= homeFeaturedProductLimit) {
      break;
    }
  }

  return selectedProducts;
}

function pickFirstProductsFromDistinctGroups(products: readonly Product[]) {
  const selectedProducts: Product[] = [];
  const seenGroupIds = new Set<string>();

  for (const product of products) {
    if (seenGroupIds.has(product.groupId)) {
      continue;
    }

    seenGroupIds.add(product.groupId);
    selectedProducts.push(product);

    if (selectedProducts.length >= homeFeaturedProductLimit) {
      break;
    }
  }

  return selectedProducts;
}

function pickHomeFeaturedProducts(
  products: readonly Product[],
  groups: readonly HomeProductGroup[],
) {
  const groupedProducts = pickFirstProductsFromGroups(products, groups);

  return groupedProducts.length > 0
    ? groupedProducts
    : pickFirstProductsFromDistinctGroups(products);
}

export async function getHomeFeaturedProducts(locale: Locale, draft = false): Promise<Product[]> {
  const [products, groups] = await Promise.all([
    getCmsProducts(locale, draft),
    getCmsProductGroups(locale),
  ]);
  const localizedProducts = productsForHomeLocale(products, locale);

  return pickHomeFeaturedProducts(localizedProducts, groups);
}

export async function getHomeProductSearchStats(locale: Locale, draft = false) {
  const [products, groups] = await Promise.all([
    getCmsProducts(locale, draft),
    getCmsProductGroups(locale),
  ]);

  return {
    catalogCount: products.length,
    groupCount: groups.length,
  };
}
