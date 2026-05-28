import { extractedProducts } from '@/lib/content/extractedProducts';
import { buildCatalogSlots, catalogGroups } from '@/lib/content/productCatalog';
import type { Locale } from '@/lib/i18n/locale';
import { featuredProducts as fallbackFeaturedProducts, type Product } from '@/lib/mock/products';

import {
  getCmsProductCategories,
  getCmsProductGroups,
  getCmsProducts,
  type CmsProductGroup,
} from './products';

const homeFeaturedProductLimit = 5;

const fallbackHomeProducts =
  extractedProducts.length > 0 ? extractedProducts : fallbackFeaturedProducts;

type HomeProductGroup = Pick<CmsProductGroup, 'id'>;

const fallbackHomeProductGroups: readonly HomeProductGroup[] = catalogGroups.map((group) => ({
  id: group.id,
}));

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
  const orderedGroups = groups.length > 0 ? groups : fallbackHomeProductGroups;
  const groupedProducts = pickFirstProductsFromGroups(products, orderedGroups);

  return groupedProducts.length > 0
    ? groupedProducts
    : pickFirstProductsFromDistinctGroups(products);
}

export async function getHomeFeaturedProducts(locale: Locale, draft = false): Promise<Product[]> {
  try {
    const [products, groups] = await Promise.all([
      getCmsProducts(locale, draft),
      getCmsProductGroups(locale),
    ]);

    return pickHomeFeaturedProducts(products, groups);
  } catch (error) {
    console.warn('[home] failed to load CMS homepage products; using extracted products', {
      error,
    });

    return pickHomeFeaturedProducts(fallbackHomeProducts, fallbackHomeProductGroups);
  }
}

export async function getHomeProductSearchStats(locale: Locale, draft = false) {
  try {
    const [products, groups, categories] = await Promise.all([
      getCmsProducts(locale, draft),
      getCmsProductGroups(locale),
      getCmsProductCategories(locale),
    ]);
    const useCmsCatalog = groups.length > 0 && categories.length > 0;

    return {
      catalogCount: useCmsCatalog ? products.length : buildCatalogSlots(products).length,
      groupCount: useCmsCatalog ? groups.length : catalogGroups.length,
    };
  } catch (error) {
    console.warn('[home] failed to load CMS product stats; using fallback catalog stats', {
      error,
    });

    return {
      catalogCount: buildCatalogSlots(fallbackHomeProducts).length,
      groupCount: catalogGroups.length,
    };
  }
}
