import type { Payload } from 'payload';

import extractedProductPayload from '../../src/lib/content/extracted-products.generated.json';

import {
  localized,
  localizedRichTextFromPlainText,
  splitLocalizedData,
  textRows,
  type LocalizedString,
  type SeedOptions,
  type SeedResult,
} from './lib/shared';
import { upsertCollection } from './lib/upsert';

type IdMap = Map<string, number>;

type ExtractedProduct = {
  applications?: string[];
  categoryId?: string;
  categoryName?: string;
  description?: string;
  features?: string[];
  groupId: string;
  id: string;
  materials?: string[];
  model?: string;
  name: string;
  sku?: string;
  specifications?: Array<{
    label: string;
    value: string;
  }>;
  standards?: string[];
};

type ExtractedProductPayload = {
  products: ExtractedProduct[];
};

const payload = extractedProductPayload as ExtractedProductPayload;

const findProductGroupIds = async (payloadClient: Payload): Promise<IdMap> => {
  const productGroups = await payloadClient.find({
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

const findCategoryIds = async (payloadClient: Payload): Promise<IdMap> => {
  const categories = await payloadClient.find({
    collection: 'product-categories',
    depth: 0,
    limit: 200,
    overrideAccess: true,
  });

  return new Map(
    categories.docs.map((category) => {
      const doc = category as { categoryId?: unknown; id?: string | number };
      return [String(doc.categoryId), Number(doc.id)];
    }),
  );
};

const localizedSame = (value: string): LocalizedString => localized(value, value, value);

const localizedRows = (values: readonly string[] | undefined) => {
  const rows = (values ?? []).filter(Boolean);

  return {
    en: textRows(rows),
    ru: textRows(rows),
    zh: textRows(rows),
  };
};

export const importExtractedProducts = async (
  payloadClient: Payload,
  options: SeedOptions,
): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };
  const [productGroupIds, categoryIds] = await Promise.all([
    findProductGroupIds(payloadClient),
    findCategoryIds(payloadClient),
  ]);

  for (const product of payload.products) {
    const productGroup = productGroupIds.get(product.groupId);

    if (!productGroup) {
      throw new Error(
        `Missing product group for extracted product ${product.id}: ${product.groupId}`,
      );
    }

    const category = product.categoryId ? categoryIds.get(product.categoryId) : undefined;
    const description = product.description || product.name;
    const standards = product.standards ?? [];
    const specifications = (product.specifications ?? [])
      .filter((specification) => specification.label && specification.value)
      .map((specification, index) => ({
        group: 'extracted',
        label: localizedSame(specification.label),
        order: index + 1,
        value: localizedSame(specification.value),
      }));
    const tags = [product.name, product.categoryName, product.groupId].filter(
      (value): value is string => Boolean(value),
    );
    const data = {
      productId: product.id,
      ...(product.sku ? { sku: product.sku } : {}),
      model: product.model ?? '',
      name: localizedSame(product.name),
      slug: product.id,
      productGroup,
      ...(category ? { category } : {}),
      tags: localizedRows(tags),
      standards: textRows(standards),
      materials: localizedRows(product.materials),
      applications: localizedRows(product.applications),
      features: (product.features ?? []).map((feature) => ({
        title: localizedSame(feature),
      })),
      specifications,
      description: localizedRichTextFromPlainText(localizedSame(description)),
      relatedProducts: [],
      faqs: [],
      isFeatured: product.id === 'firefighter-suit-combat',
      displayOrder: product.id === 'firefighter-suit-combat' ? 1 : 0,
      publishedAt: new Date().toISOString(),
      _status: 'published',
    };
    const { zhData, localizedData } = splitLocalizedData(data);
    const upserted = await upsertCollection({
      collection: 'products',
      data: zhData,
      localizedData,
      payload: payloadClient,
      uniqueField: 'productId',
      uniqueValue: product.id,
      options,
    });

    result.created += upserted.created;
    result.updated += upserted.updated;
    result.skipped += upserted.skipped;
  }

  return result;
};
