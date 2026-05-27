/* eslint-disable no-restricted-syntax -- Seed scripts load .env.local before initializing Payload locally. */
import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Payload } from 'payload';

import {
  discoverOfficialMaterials,
  normalizeProductName,
  officialMaterialMediaTag,
  type OfficialMaterial,
} from './import-official-materials';
import { splitLocalizedMediaData } from './lib/shared';

type ProductDoc = {
  id: string | number;
  productId?: string;
  slug?: string;
  name?: string;
  model?: string;
  sku?: string;
  _status?: string;
  publishedAt?: string;
};

type SyncOfficialMaterialImagesOptions = {
  apply: boolean;
  materialsRoot: string;
  replaceMedia: boolean;
};

type ProductImageUpdateData = {
  images: Array<{ file: string | number }>;
  visualGroups: Array<{
    description: string;
    images: Array<{ file: string | number }>;
    title: string;
    variant: string;
  }>;
};

type DbQuery = (sql: string, params?: unknown[]) => Promise<unknown>;

type MatchResult =
  | { doc: ProductDoc; strategy: string }
  | { ambiguous: ProductDoc[]; strategy: string }
  | { strategy: 'none' };

const modelTokensFrom = (value: string) =>
  Array.from(
    new Set((value.match(/[A-Z]+[-\w]*(?:-\d+)?/gi) ?? []).map((item) => item.toUpperCase())),
  );

const productName = (doc: ProductDoc) => (typeof doc.name === 'string' ? doc.name : '');

const productModelTokens = (doc: ProductDoc) =>
  modelTokensFrom([doc.model, doc.sku, doc.productId, doc.slug].filter(Boolean).join(' '));

const threeLocaleText = (value: string) => ({ zh: value, en: value, ru: value });

export const buildOfficialImageUpdateData = (
  _material: OfficialMaterial,
  mediaIds: Array<string | number>,
) => ({
  images: mediaIds.slice(0, 1).map((file) => ({ file })),
  visualGroups: mediaIds.length
    ? [
        {
          variant: 'gallery',
          title: '产品图册',
          description: '展示产品图片、细节与穿着效果。',
          images: mediaIds.map((file) => ({ file })),
        },
      ]
    : [],
});

const galleryCopy = {
  zh: {
    title: '产品图册',
    description: (_material: OfficialMaterial) => '展示产品图片、细节与穿着效果。',
  },
  en: {
    title: 'Product gallery',
    description: (_material: OfficialMaterial) =>
      'Shows product images, details, and wearing effect.',
  },
  ru: {
    title: 'Галерея продукта',
    description: (_material: OfficialMaterial) =>
      'Показывает изображения, детали и посадку изделия.',
  },
} as const;

const productLocales = ['zh', 'en', 'ru'] as const;

function newArrayRowId() {
  return randomBytes(12).toString('hex');
}

function getDbQuery(payload: Payload): DbQuery | undefined {
  const db = (
    payload as unknown as {
      db?: { pool?: { query?: DbQuery } };
    }
  ).db;

  return db?.pool?.query?.bind(db.pool);
}

function findProductMatch(material: OfficialMaterial, products: ProductDoc[]): MatchResult {
  const materialModelTokens = new Set(material.modelTokens);
  const targetName = normalizeProductName(material.name);
  const namedCandidates = products.filter((doc) => normalizeProductName(productName(doc)));
  const exactNameMatches = namedCandidates.filter(
    (doc) => normalizeProductName(productName(doc)) === targetName,
  );

  const exactNameMatch = exactNameMatches[0];

  if (exactNameMatches.length === 1 && exactNameMatch) {
    return { doc: exactNameMatch, strategy: 'name' };
  }

  if (exactNameMatches.length > 1) {
    const exactNameAndModelMatches = exactNameMatches.filter((doc) =>
      productModelTokens(doc).some((token) => materialModelTokens.has(token)),
    );

    const exactNameAndModelMatch = exactNameAndModelMatches[0];

    if (exactNameAndModelMatches.length === 1 && exactNameAndModelMatch) {
      return { doc: exactNameAndModelMatch, strategy: 'name+model' };
    }

    return { ambiguous: exactNameMatches, strategy: 'name' };
  }

  if (materialModelTokens.size > 0) {
    const modelMatches = products.filter((doc) =>
      productModelTokens(doc).some((token) => materialModelTokens.has(token)),
    );

    const modelMatch = modelMatches[0];

    if (modelMatches.length === 1 && modelMatch) {
      return { doc: modelMatch, strategy: 'model' };
    }

    if (modelMatches.length > 1) {
      return { ambiguous: modelMatches, strategy: 'model' };
    }
  }

  const containsMatches = namedCandidates.filter((doc) => {
    const source = normalizeProductName(productName(doc));
    return source.includes(targetName) || targetName.includes(source);
  });

  const containsMatch = containsMatches[0];

  if (containsMatches.length === 1 && containsMatch) {
    return { doc: containsMatch, strategy: 'name-contains' };
  }

  if (containsMatches.length > 1) {
    return { ambiguous: containsMatches, strategy: 'name-contains' };
  }

  return { strategy: 'none' };
}

function mediaDataFor(material: OfficialMaterial, imagePath: string, index: number) {
  const title = `${material.name} 官网资料图 ${index + 1}`;

  return {
    alt: threeLocaleText(title),
    caption: threeLocaleText(title),
    credit: '官网资料',
    folder: 'products',
    tags: [
      { value: officialMaterialMediaTag(material, imagePath) },
      { value: 'official-material-images' },
      ...(material.modelTokens.length ? [{ value: material.modelTokens.join(',') }] : []),
    ],
    usageCount: 0,
  };
}

async function uploadOrReuseMedia(
  payload: Payload,
  material: OfficialMaterial,
  imagePath: string,
  index: number,
  options: SyncOfficialMaterialImagesOptions,
) {
  const tag = officialMaterialMediaTag(material, imagePath);
  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      'tags.value': {
        equals: tag,
      },
    },
  });
  const existingDoc = existing.docs[0] as { id?: string | number } | undefined;
  const { zhData, localizedData } = splitLocalizedMediaData(
    mediaDataFor(material, imagePath, index),
  );

  if (!options.apply) {
    return {
      action: existingDoc?.id ? 'reuse' : 'create',
      id: existingDoc?.id ?? `dry-media-${index + 1}`,
    };
  }

  if (existingDoc?.id) {
    await payload.update({
      collection: 'media',
      data: zhData as never,
      depth: 0,
      ...(options.replaceMedia ? { filePath: imagePath } : {}),
      id: existingDoc.id,
      locale: 'zh',
      overrideAccess: true,
    } as never);

    for (const locale of ['en', 'ru'] as const) {
      await payload.update({
        collection: 'media',
        data: localizedData[locale] as never,
        depth: 0,
        id: existingDoc.id,
        locale,
        overrideAccess: true,
      } as never);
    }

    return { action: 'update', id: existingDoc.id };
  }

  const created = await payload.create({
    collection: 'media',
    data: zhData,
    depth: 0,
    filePath: imagePath,
    locale: 'zh',
    overrideAccess: true,
  });

  for (const locale of ['en', 'ru'] as const) {
    await payload.update({
      collection: 'media',
      data: localizedData[locale] as never,
      depth: 0,
      id: created.id,
      locale,
      overrideAccess: true,
    } as never);
  }

  return { action: 'create', id: created.id };
}

async function resetProductImageRows(payload: Payload, id: string | number) {
  const query = getDbQuery(payload);

  if (typeof query !== 'function') {
    return;
  }

  await query(
    'delete from products_visual_groups_images where _parent_id in (select id from products_visual_groups where _parent_id = $1)',
    [id],
  );
  await query('delete from products_visual_groups where _parent_id = $1', [id]);
  await query('delete from products_images where _parent_id = $1', [id]);
  await query(
    "delete from products_rels where parent_id = $1 and (path like 'images.%' or path like 'visualGroups.%')",
    [id],
  );
}

async function findProducts(payload: Payload) {
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    draft: true,
    locale: 'zh',
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
  });

  return result.docs as ProductDoc[];
}

async function updateProductImages(
  payload: Payload,
  product: ProductDoc,
  material: OfficialMaterial,
  data: ProductImageUpdateData,
  options: SyncOfficialMaterialImagesOptions,
) {
  if (!options.apply) {
    return;
  }

  const query = getDbQuery(payload);

  if (typeof query !== 'function') {
    throw new Error('Payload database pool is not available for image sync.');
  }

  await query('begin');

  try {
    await resetProductImageRows(payload, product.id);

    for (const [index, image] of data.images.entries()) {
      const rowId = newArrayRowId();

      await query('insert into products_images (_order, _parent_id, id) values ($1, $2, $3)', [
        index + 1,
        product.id,
        rowId,
      ]);
      await query(
        'insert into products_rels ("order", parent_id, path, locale, media_id) values ($1, $2, $3, $4, $5)',
        [null, product.id, `images.${index}.file`, null, image.file],
      );
    }

    for (const [groupIndex, group] of data.visualGroups.entries()) {
      for (const locale of productLocales) {
        const rowId = newArrayRowId();
        const localizedCopy = galleryCopy[locale];

        await query(
          'insert into products_visual_groups (_order, _parent_id, _locale, id, variant, title, description) values ($1, $2, $3, $4, $5, $6, $7)',
          [
            groupIndex + 1,
            product.id,
            locale,
            rowId,
            group.variant,
            localizedCopy.title,
            localizedCopy.description(material),
          ],
        );

        for (const [imageIndex, image] of group.images.entries()) {
          const imageRowId = newArrayRowId();

          await query(
            'insert into products_visual_groups_images (_order, _parent_id, _locale, id) values ($1, $2, $3, $4)',
            [imageIndex + 1, rowId, locale, imageRowId],
          );
          await query(
            'insert into products_rels ("order", parent_id, path, locale, media_id) values ($1, $2, $3, $4, $5)',
            [
              null,
              product.id,
              `visualGroups.${groupIndex}.images.${imageIndex}.file`,
              locale,
              image.file,
            ],
          );
        }
      }
    }

    await query('update products set updated_at = now() where id = $1', [product.id]);
    await query('commit');
  } catch (error) {
    await query('rollback');
    throw error;
  }
}

const loadEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;

    const equalIndex = line.indexOf('=');
    const key = line.slice(0, equalIndex).trim();
    const rawValue = line.slice(equalIndex + 1).trim();

    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
};

const setupEnv = () => {
  process.env.PAYLOAD_SEED_MODE = 'true';
  process.env.PAYLOAD_CONFIG_PATH = process.env.PAYLOAD_CONFIG_PATH || 'src/payload.config.ts';
  process.env.STRICT_I18N_PUBLISH = 'false';
  process.env.REVALIDATE_SECRET = '';
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  loadEnvFile(path.resolve(process.cwd(), '.env'));
};

async function initPayloadForImport() {
  setupEnv();
  const [{ default: payload }, secretModule] = await Promise.all([
    import('payload'),
    import('../../src/lib/payload/secret'),
  ]);

  await payload.init({
    local: true,
    secret: secretModule.getPayloadSecret(process.env),
  });

  return payload;
}

export const parseSyncOfficialMaterialImagesOptions = (
  argv = process.argv,
): SyncOfficialMaterialImagesOptions => ({
  apply: argv.includes('--apply'),
  materialsRoot: path.resolve(process.cwd(), '官网资料'),
  replaceMedia: argv.includes('--replace-media'),
});

export async function syncOfficialMaterialImages(
  payload: Payload,
  options: SyncOfficialMaterialImagesOptions,
) {
  const materials = discoverOfficialMaterials(options.materialsRoot);
  const products = await findProducts(payload);
  const summary = {
    ambiguous: [] as string[],
    dryRun: !options.apply,
    matched: 0,
    mediaCreated: 0,
    mediaReused: 0,
    mediaUpdated: 0,
    productsUpdated: 0,
    total: materials.length,
    unmatched: [] as string[],
  };

  for (const material of materials) {
    const match = findProductMatch(material, products);

    if ('ambiguous' in match) {
      const names = match.ambiguous
        .map((doc) => `${doc.id}:${productName(doc)}:${doc.model || doc.sku || ''}`)
        .join(' | ');
      summary.ambiguous.push(`${material.name} ${material.model} -> ${names}`);
      console.warn(`AMBIGUOUS ${material.name} ${material.model} -> ${names}`);
      continue;
    }

    if (!('doc' in match)) {
      summary.unmatched.push(`${material.name} ${material.model}`);
      console.warn(`UNMATCHED ${material.name} ${material.model}`);
      continue;
    }

    const mediaResults = [];

    for (const [index, imagePath] of material.imagePaths.entries()) {
      const mediaResult = await uploadOrReuseMedia(payload, material, imagePath, index, options);
      mediaResults.push(mediaResult);

      if (mediaResult.action === 'create') summary.mediaCreated += 1;
      if (mediaResult.action === 'update') summary.mediaUpdated += 1;
      if (mediaResult.action === 'reuse') summary.mediaReused += 1;
    }

    const mediaIds = mediaResults
      .map((item) => item.id)
      .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number');
    const updateData = buildOfficialImageUpdateData(material, mediaIds);

    await updateProductImages(payload, match.doc, material, updateData, options);

    summary.matched += 1;
    summary.productsUpdated += 1;
    console.log(
      `${options.apply ? 'UPDATED' : 'DRY-UPDATE'} ${material.name} ${material.model} -> ${match.doc.id} (${match.strategy}) images=${mediaIds.length}`,
    );
  }

  return summary;
}

const run = async () => {
  const options = parseSyncOfficialMaterialImagesOptions();
  const payload = await initPayloadForImport();
  const summary = await syncOfficialMaterialImages(payload, options);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.ambiguous.length || summary.unmatched.length) {
    process.exitCode = 1;
  }
};

const isMain = process.argv[1]
  ? path.basename(process.argv[1]) === 'sync-official-material-images.ts'
  : false;

if (isMain) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
