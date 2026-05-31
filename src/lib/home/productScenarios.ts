import type { Locale } from '@/lib/i18n/locale';
import { localized, type Product, type ProductGroupId } from '@/lib/product/types';

export type HomeProductScenario = Readonly<{
  group: ProductGroupId;
  label: string;
}>;

export function buildHomeProductScenarios(
  products: readonly Product[],
  locale: Locale,
): readonly HomeProductScenario[] {
  const seenGroups = new Set<ProductGroupId>();
  const scenarios: HomeProductScenario[] = [];

  for (const product of products) {
    if (seenGroups.has(product.groupId)) {
      continue;
    }

    seenGroups.add(product.groupId);
    scenarios.push({
      group: product.groupId,
      label: localized(product.categoryName, locale),
    });
  }

  return scenarios;
}
