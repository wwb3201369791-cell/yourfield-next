import type { Payload } from 'payload';

import { productGroupSeeds } from './lib/legacy-data';
import { splitLocalizedData, type SeedOptions, type SeedResult } from './lib/shared';
import { upsertCollection } from './lib/upsert';

export const importProductGroups = async (
  payload: Payload,
  options: SeedOptions,
): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };

  for (const group of productGroupSeeds) {
    const data = {
      groupId: group.groupId,
      slug: group.groupId,
      name: group.name,
      description: group.description,
      order: group.order,
      showOnFrontend: true,
      seo: {
        title: group.name,
        description: group.description,
        noindex: false,
      },
    };
    const { zhData, localizedData } = splitLocalizedData({
      ...data,
      showOnFrontend: false,
    });

    const upserted = await upsertCollection({
      collection: 'product-groups',
      data: zhData,
      localizedData,
      payload,
      uniqueField: 'groupId',
      uniqueValue: group.groupId,
      options,
    });

    if (!options.skipExisting) {
      await payload.update({
        collection: 'product-groups',
        data: { showOnFrontend: true },
        depth: 0,
        id: upserted.id,
        locale: 'zh',
        overrideAccess: true,
      });
    }

    result.created += upserted.created;
    result.updated += upserted.updated;
    result.skipped += upserted.skipped;
  }

  return result;
};
