import type { Payload } from 'payload';

import { categorySeeds, productSeeds } from './lib/legacy-data';
import {
  localized,
  localizedRichTextFromPlainText,
  splitLocalizedData,
  textRows,
  type Locale,
  type LocalizedString,
  type SeedOptions,
  type SeedResult,
} from './lib/shared';
import { upsertCollection } from './lib/upsert';

type MediaManifest = Map<string, number>;

type IdMap = Map<string, number>;
type ProductSpecificationSeed = {
  label: LocalizedString;
  value: LocalizedString;
  group: string;
  order: number;
};
type ProductSpecificationDoc = {
  id?: string | number;
};

const nonDefaultLocales = ['en', 'ru'] as const satisfies ReadonlyArray<Exclude<Locale, 'zh'>>;

const findCategoryIds = async (payload: Payload): Promise<IdMap> => {
  const categories = await payload.find({
    collection: 'product-categories',
    depth: 0,
    limit: 100,
    overrideAccess: true,
  });

  return new Map(
    categories.docs.map((category) => {
      const doc = category as { categoryId?: unknown; id?: string | number };
      return [String(doc.categoryId), Number(doc.id)];
    }),
  );
};

const findProductGroupIds = async (payload: Payload): Promise<IdMap> => {
  const productGroups = await payload.find({
    collection: 'product-groups',
    depth: 0,
    limit: 100,
    overrideAccess: true,
  });

  return new Map(
    productGroups.docs.map((productGroup) => {
      const doc = productGroup as { groupId?: unknown; id?: string | number };
      return [String(doc.groupId), Number(doc.id)];
    }),
  );
};

const groupIdByCategoryId = new Map(
  categorySeeds.map((category) => [category.categoryId, category.group]),
);

const localizedArray = (value: LocalizedString) => ({
  zh: [{ value: value.zh }],
  en: [{ value: value.en }],
  ru: [{ value: value.ru }],
});

const localizedCsvRows = (value: LocalizedString) => ({
  zh: textRows(value.zh.split(',').map((item) => item.trim())),
  en: textRows(value.en.split(',').map((item) => item.trim())),
  ru: textRows(value.ru.split(',').map((item) => item.trim())),
});

const updateLocalizedProductData = async (
  payload: Payload,
  id: string,
  localizedData: Record<Exclude<Locale, 'zh'>, Record<string, unknown>>,
  specifications: ProductSpecificationSeed[],
) => {
  const existing = (await payload.findByID({
    collection: 'products',
    id,
    depth: 0,
    locale: 'zh',
    overrideAccess: true,
  })) as { specifications?: ProductSpecificationDoc[] };

  for (const locale of nonDefaultLocales) {
    await payload.update({
      collection: 'products',
      id,
      data: {
        ...localizedData[locale],
        specifications: specifications.map((specification, index) => {
          const rowId = existing.specifications?.[index]?.id;

          return {
            ...(rowId ? { id: String(rowId) } : {}),
            label: specification.label[locale],
            value: specification.value[locale],
            group: specification.group,
            order: specification.order,
          };
        }),
      },
      depth: 0,
      locale,
      overrideAccess: true,
    });
  }
};

export const importLegacyProducts = async (
  payload: Payload,
  options: SeedOptions,
  mediaManifest: MediaManifest,
): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };
  const categoryIds = await findCategoryIds(payload);
  const productGroupIds = await findProductGroupIds(payload);

  for (const product of productSeeds) {
    const category = categoryIds.get(product.categoryId);
    const groupId = groupIdByCategoryId.get(product.categoryId);
    const productGroup = groupId ? productGroupIds.get(groupId) : undefined;
    const image = mediaManifest.get(product.imagePath);

    if (!productGroup) {
      throw new Error(
        `Missing product group for product ${product.productId}: ${groupId ?? product.categoryId}`,
      );
    }

    if (!image) {
      throw new Error(`Missing media for product ${product.productId}: ${product.imagePath}`);
    }

    const specifications: ProductSpecificationSeed[] = [
      {
        label: product.name,
        value: localized(product.model, product.model, product.model),
        group: 'model',
        order: 1,
      },
      {
        label: localized('执行标准', 'Standard', 'Стандарт'),
        value: localized(
          product.standards[0] || 'TBD',
          product.standards[0] || 'TBD',
          product.standards[0] || 'TBD',
        ),
        group: 'standard',
        order: 2,
      },
    ];

    const data = {
      productId: product.productId,
      sku: product.sku,
      model: product.model,
      name: product.name,
      slug: product.productId,
      productGroup,
      ...(category ? { category } : {}),
      industries: product.industries,
      tags: localizedCsvRows(product.tags),
      standards: textRows(product.standards),
      materials: localizedArray(
        localized('防护材料', 'Protective materials', 'Защитные материалы'),
      ),
      applications: localizedArray(product.description),
      features: [
        {
          title: localized('可靠防护', 'Reliable protection', 'Надежная защита'),
          description: product.description,
        },
      ],
      specifications,
      sizeRange: textRows(['按需定制']),
      description: localizedRichTextFromPlainText(product.description),
      images: [{ file: image }],
      relatedProducts: [],
      faqs: [],
      isFeatured: Boolean(product.isFeatured),
      displayOrder: product.isFeatured ? 1 : 0,
      publishedAt: new Date().toISOString(),
      _status: 'published',
    };
    const { zhData, localizedData } = splitLocalizedData(data);

    const upserted = await upsertCollection({
      collection: 'products',
      data: zhData,
      payload,
      uniqueField: 'productId',
      uniqueValue: product.productId,
      options,
    });

    if (!upserted.skipped) {
      await updateLocalizedProductData(payload, upserted.id, localizedData, specifications);
    }

    result.created += upserted.created;
    result.updated += upserted.updated;
    result.skipped += upserted.skipped;
  }

  return result;
};
