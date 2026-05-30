import type { Payload } from 'payload';

import type { LocalizedData, SeedOptions, SeedResult } from './shared';

type PayloadData = { [key: string]: Partial<unknown> | undefined };
type GlobalDoc = Record<string, unknown>;

export type UpsertArgs = {
  collection: string;
  data: Record<string, unknown>;
  localizedData?: LocalizedData;
  payload: Payload;
  uniqueField: string;
  uniqueValue: string;
  options: SeedOptions;
};

export const upsertCollection = async ({
  collection,
  data,
  localizedData,
  payload,
  uniqueField,
  uniqueValue,
  options,
}: UpsertArgs): Promise<SeedResult & { id: string }> => {
  const existing = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      [uniqueField]: {
        equals: uniqueValue,
      },
    },
  });

  const existingDoc = existing.docs[0] as { id?: string | number } | undefined;

  if (existingDoc?.id) {
    const id = String(existingDoc.id);
    if (options.skipExisting) {
      return { created: 0, updated: 0, skipped: 1, id };
    }

    await payload.update({
      collection,
      id,
      data: data as PayloadData,
      depth: 0,
      locale: 'zh',
      overrideAccess: true,
    });

    if (localizedData) {
      for (const locale of ['en', 'ru'] as const) {
        await payload.update({
          collection,
          id,
          data: localizedData[locale] as PayloadData,
          depth: 0,
          locale,
          overrideAccess: true,
        });
      }
    }

    return { created: 0, updated: 1, skipped: 0, id };
  }

  const created = (await payload.create({
    collection,
    data: data as PayloadData,
    depth: 0,
    locale: 'zh',
    overrideAccess: true,
  })) as { id?: string | number };

  const id = String(created.id);

  if (localizedData) {
    for (const locale of ['en', 'ru'] as const) {
      await payload.update({
        collection,
        id,
        data: localizedData[locale] as PayloadData,
        depth: 0,
        locale,
        overrideAccess: true,
      });
    }
  }

  return { created: 1, updated: 0, skipped: 0, id };
};

export const upsertGlobal = async ({
  data,
  global,
  isSeeded,
  localizedData,
  options,
  payload,
}: {
  data: Record<string, unknown>;
  global: string;
  isSeeded?: (doc: GlobalDoc) => boolean;
  localizedData?: LocalizedData;
  options: SeedOptions;
  payload: Payload;
}): Promise<SeedResult> => {
  if (options.skipExisting) {
    try {
      const existing = (await payload.findGlobal({
        slug: global,
        depth: 0,
        overrideAccess: true,
      })) as GlobalDoc;
      if (!isSeeded || isSeeded(existing)) {
        return { created: 0, updated: 0, skipped: 1 };
      }
    } catch {
      // Payload creates globals on update; fall through to update.
    }
  }

  await payload.updateGlobal({
    slug: global,
    data: data as PayloadData,
    depth: 0,
    locale: 'zh',
    overrideAccess: true,
  });

  if (localizedData) {
    for (const locale of ['en', 'ru'] as const) {
      await payload.updateGlobal({
        slug: global,
        data: localizedData[locale] as PayloadData,
        depth: 0,
        locale,
        overrideAccess: true,
      });
    }
  }

  return { created: 0, updated: 1, skipped: 0 };
};
