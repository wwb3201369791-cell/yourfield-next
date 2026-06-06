import type { Payload } from 'payload';

import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';
import zhMessages from '../../messages/zh.json';
import {
  localizedRichTextFromPlainText,
  splitLocalizedData,
  type Locale,
  type LocalizedString,
  type SeedOptions,
  type SeedResult,
} from './lib/shared';
import { upsertCollection } from './lib/upsert';

type MediaManifest = Map<string, number>;
type MessageMap = Record<string, string>;
type PayloadDoc = { id?: string | number };
type RelationId = string | number;

type SolutionSeed = {
  featureKeys?: readonly string[];
  imagePath: string;
  order: number;
  productGroupIds: readonly string[];
  productIds?: readonly string[];
  productTags: readonly LocalizedString[];
  solutionId: string;
  summaryKey: string;
  titleKey: string;
};

const messages: Record<Locale, MessageMap> = {
  zh: zhMessages as unknown as MessageMap,
  en: enMessages as unknown as MessageMap,
  ru: ruMessages as unknown as MessageMap,
};

const msg = (locale: Locale, key: string) => messages[locale][key] || messages.zh[key] || key;

const messageText = (key: string): LocalizedString => ({
  zh: msg('zh', key),
  en: msg('en', key),
  ru: msg('ru', key),
});

const messageRows = (keys: readonly string[]) => keys.map(messageText);
const localizedRows = (values: readonly LocalizedString[]) => values.map((value) => ({ value }));

const solutionImage = (fileName: string) => `assets/images/solutions/${fileName}`;

const solutionSeeds: readonly SolutionSeed[] = [
  {
    solutionId: 'power-energy',
    titleKey: 'page.solutions.powerTitle',
    summaryKey: 'page.solutions.powerText',
    imagePath: solutionImage('solution-power-grid.jpg'),
    order: 1,
    productGroupIds: ['electrical-protection'],
    productIds: ['arc-flash-suit', 'live-line-shielding-suit', 'insulating-gloves'],
    featureKeys: [
      'page.solutions.powerF1',
      'page.solutions.powerF2',
      'page.solutions.powerF3',
      'page.solutions.powerF4',
    ],
    productTags: messageRows([
      'page.solutions.tagArcFlash',
      'page.solutions.tagShielding',
      'page.solutions.tagGloves',
      'page.solutions.tagElectrical',
    ]),
  },
  {
    solutionId: 'petrochemical',
    titleKey: 'page.solutions.petroTitle',
    summaryKey: 'page.solutions.petroText',
    imagePath: solutionImage('solution-petrochemical.jpg'),
    order: 2,
    productGroupIds: ['chemical-medical', 'thermal-welding'],
    productIds: ['chemical-protective-suit', 'medical-protective-clothing'],
    featureKeys: [
      'page.solutions.petroF1',
      'page.solutions.petroF2',
      'page.solutions.petroF3',
      'page.solutions.petroF4',
    ],
    productTags: messageRows([
      'page.solutions.tagChemical',
      'page.solutions.tagFR',
      'page.solutions.tagRespiratory',
      'page.solutions.tagAccessories',
    ]),
  },
  {
    solutionId: 'manufacturing',
    titleKey: 'page.solutions.manufacturingTitle',
    summaryKey: 'page.solutions.manufacturingText',
    imagePath: solutionImage('solution-equipment-manufacturing.jpg'),
    order: 3,
    productGroupIds: ['thermal-welding', 'electrical-protection'],
    productIds: ['welding-protective-clothing', 'arc-flash-suit'],
    featureKeys: [
      'page.solutions.manufacturingF1',
      'page.solutions.manufacturingF2',
      'page.solutions.manufacturingF3',
      'page.solutions.manufacturingF4',
    ],
    productTags: messageRows([
      'page.solutions.tagWelding',
      'page.solutions.tagCut',
      'page.solutions.tagESD',
      'page.solutions.tagFootwear',
    ]),
  },
  {
    solutionId: 'emergency-response',
    titleKey: 'page.solutions.emergencyTitle',
    summaryKey: 'page.solutions.emergencyText',
    imagePath: solutionImage('solution-emergency-rescue.jpg'),
    order: 4,
    productGroupIds: ['fire-rescue', 'chemical-medical'],
    productIds: [
      'firefighter-suit-combat',
      'chemical-protective-suit',
      'medical-protective-clothing',
    ],
    featureKeys: [
      'page.solutions.emergencyF1',
      'page.solutions.emergencyF2',
      'page.solutions.emergencyF3',
      'page.solutions.emergencyF4',
    ],
    productTags: messageRows([
      'page.solutions.tagFirefighter',
      'page.solutions.tagRescue',
      'page.solutions.tagHazmat',
      'page.solutions.tagMedical',
    ]),
  },
];

async function findRelationIds(
  payload: Payload,
  collection: 'product-groups' | 'products',
  uniqueField: 'groupId' | 'productId',
  values: readonly string[],
) {
  const ids: RelationId[] = [];

  for (const value of values) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        [uniqueField]: {
          equals: value,
        },
      },
    });
    const doc = result.docs[0] as PayloadDoc | undefined;
    if (doc?.id) {
      ids.push(doc.id);
    }
  }

  return ids;
}

export const importLegacySolutions = async (
  payload: Payload,
  options: SeedOptions,
  mediaManifest: MediaManifest,
): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };

  for (const solution of solutionSeeds) {
    const title = messageText(solution.titleKey);
    const summary = messageText(solution.summaryKey);
    const relatedProductGroups = await findRelationIds(
      payload,
      'product-groups',
      'groupId',
      solution.productGroupIds,
    );
    const relatedProducts = await findRelationIds(
      payload,
      'products',
      'productId',
      solution.productIds ?? [],
    );
    const cover = mediaManifest.get(solution.imagePath);
    const data = {
      solutionId: solution.solutionId,
      slug: solution.solutionId,
      title,
      summary,
      ...(cover ? { cover } : {}),
      content: localizedRichTextFromPlainText(summary),
      features: localizedRows(solution.featureKeys ? messageRows(solution.featureKeys) : []),
      productTags: localizedRows(solution.productTags),
      relatedProductGroups,
      relatedProducts,
      order: solution.order,
      publishedAt: new Date().toISOString(),
      _status: 'published',
    };
    const { zhData, localizedData } = splitLocalizedData({
      ...data,
      _status: 'draft',
    });

    const upserted = await upsertCollection({
      collection: 'solutions',
      data: zhData,
      localizedData,
      payload,
      uniqueField: 'solutionId',
      uniqueValue: solution.solutionId,
      options,
    });

    if (!options.skipExisting) {
      await payload.update({
        collection: 'solutions',
        data: { _status: 'published' },
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
