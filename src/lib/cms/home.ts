import type { Locale } from '@/lib/i18n/locale';
import type { Product } from '@/lib/product/types';

import { getCmsProductGroups, getCmsProducts, type CmsProductGroup } from './products';

const homeFeaturedProductLimit = 5;

type HomeProductGroup = Pick<CmsProductGroup, 'id'>;

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

  return pickHomeFeaturedProducts(products, groups);
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
