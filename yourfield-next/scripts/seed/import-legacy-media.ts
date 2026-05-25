import fs from 'fs';
import path from 'path';

import type { Payload } from 'payload';

import {
  localized,
  projectRoot,
  splitLocalizedMediaData,
  type SeedOptions,
  type SeedResult,
} from './lib/shared';

type MediaManifest = Map<string, number>;
type PayloadData = { [key: string]: Partial<unknown> | undefined };

type MediaSeed = {
  folder: 'brand' | 'products' | 'news' | 'icons' | 'misc';
  path: string;
  title: string;
};

const mediaSeeds: MediaSeed[] = [
  {
    path: 'assets/images/brand/yourfield-logo-official-a.png',
    folder: 'brand',
    title: 'YourField logo official A',
  },
  {
    path: 'assets/images/brand/yourfield-logo-official-b.png',
    folder: 'brand',
    title: 'YourField logo official B',
  },
  {
    path: 'assets/images/products/firefighter-protective-suit/modeling-jacket-front.png',
    folder: 'products',
    title: 'Firefighter protective suit front',
  },
  {
    path: 'assets/images/news/party-building-safety-industry.jpg',
    folder: 'news',
    title: '党建铸安 赋能产业',
  },
  {
    path: 'assets/images/news/central-safety-valley.png',
    folder: 'news',
    title: '对接座谈会现场',
  },
  {
    path: 'assets/images/news/may-day-safety-inspection.png',
    folder: 'news',
    title: '胡贺波带队督导检查“五一”节前安全生产工作',
  },
  {
    path: 'assets/images/solutions/solution-power-grid.jpg',
    folder: 'misc',
    title: 'Power grid solution scene',
  },
  {
    path: 'assets/images/solutions/solution-metal-smelting.jpg',
    folder: 'misc',
    title: 'Metal smelting solution scene',
  },
  {
    path: 'assets/images/solutions/solution-equipment-manufacturing.jpg',
    folder: 'misc',
    title: 'Equipment manufacturing solution scene',
  },
  {
    path: 'assets/images/solutions/solution-electronic-information.jpg',
    folder: 'misc',
    title: 'Electronic information solution scene',
  },
  {
    path: 'assets/images/solutions/solution-petrochemical.jpg',
    folder: 'misc',
    title: 'Petrochemical solution scene',
  },
  {
    path: 'assets/images/solutions/solution-emergency-rescue.jpg',
    folder: 'misc',
    title: 'Emergency rescue solution scene',
  },
  {
    path: 'assets/images/solutions/solution-food-processing.jpg',
    folder: 'misc',
    title: 'Food processing solution scene',
  },
  {
    path: 'assets/images/solutions/solution-medical-devices.jpg',
    folder: 'misc',
    title: 'Medical devices solution scene',
  },
];

const mediaDataFor = (seed: MediaSeed) => ({
  alt: localized(seed.title, seed.title, seed.title),
  caption: localized(seed.title, seed.title, seed.title),
  credit: 'YourField legacy static site',
  folder: seed.folder,
  tags: [{ value: seed.path }],
  usageCount: 0,
});

export const importLegacyMedia = async (
  payload: Payload,
  options: SeedOptions,
): Promise<SeedResult & { manifest: MediaManifest }> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };
  const manifest: MediaManifest = new Map();

  for (const seed of mediaSeeds) {
    const absolutePath = path.join(projectRoot, seed.path);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Missing seed media asset: ${absolutePath}`);
    }

    const existing = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: '-createdAt',
      where: {
        'tags.value': {
          equals: seed.path,
        },
      },
    });

    const existingDoc = existing.docs[0] as { id?: string | number } | undefined;
    const { zhData, localizedData } = splitLocalizedMediaData(mediaDataFor(seed));

    if (existingDoc?.id) {
      const id = String(existingDoc.id);
      if (options.skipExisting) {
        result.skipped += 1;
      } else {
        await payload.update({
          collection: 'media',
          id,
          data: zhData as PayloadData,
          depth: 0,
          locale: 'zh',
          overrideAccess: true,
        });
        for (const locale of ['en', 'ru'] as const) {
          await payload.update({
            collection: 'media',
            id,
            data: localizedData[locale] as PayloadData,
            depth: 0,
            locale,
            overrideAccess: true,
          });
        }
        result.updated += 1;
      }
      manifest.set(seed.path, Number(id));
      continue;
    }

    const created = (await payload.create({
      collection: 'media',
      data: zhData as PayloadData,
      depth: 0,
      filePath: absolutePath,
      locale: 'zh',
      overrideAccess: true,
    })) as { id?: string | number };

    result.created += 1;
    const createdId = String(created.id);
    for (const locale of ['en', 'ru'] as const) {
      await payload.update({
        collection: 'media',
        id: createdId,
        data: localizedData[locale] as PayloadData,
        depth: 0,
        locale,
        overrideAccess: true,
      });
    }
    manifest.set(seed.path, Number(createdId));
  }

  return { ...result, manifest };
};
