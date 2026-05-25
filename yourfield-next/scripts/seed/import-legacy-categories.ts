import type { Payload } from 'payload';

import { categorySeeds } from './lib/legacy-data';
import { splitLocalizedData, type SeedOptions, type SeedResult } from './lib/shared';
import { upsertCollection } from './lib/upsert';

export const importLegacyCategories = async (payload: Payload, options: SeedOptions): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };
  const productGroups = await payload.find({
    collection: 'product-groups',
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const productGroupIdByGroupId = new Map(
    (productGroups.docs as Array<{ groupId?: string; id?: number }>)
      .filter((group) => group.groupId && group.id)
      .map((group) => [group.groupId as string, group.id as number]),
  );

  for (const category of categorySeeds) {
    const data = {
      categoryId: category.categoryId,
      slug: category.categoryId,
      name: category.name,
      productGroup: productGroupIdByGroupId.get(category.group),
      group: category.group,
      order: category.order,
      seo: {
        title: category.name,
        description: category.name,
        noindex: false,
      },
    };
    const { zhData, localizedData } = splitLocalizedData(data);

    const upserted = await upsertCollection({
      collection: 'product-categories',
      data: zhData,
      localizedData,
      payload,
      uniqueField: 'categoryId',
      uniqueValue: category.categoryId,
      options,
    });

    result.created += upserted.created;
    result.updated += upserted.updated;
    result.skipped += upserted.skipped;
  }

  return result;
};
