/* eslint-disable no-restricted-syntax -- Seed scripts load .env.local before initializing Payload locally. */
import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Payload } from 'payload';

import extractedProductPayload from '../../src/lib/content/extracted-products.generated.json';

import { splitLocalizedMediaData } from './lib/shared';

type ExtractedProduct = {
  id: string;
  image?: string;
  images?: string[];
  model?: string;
  name: string;
};

type ExtractedProductPayload = {
  products: ExtractedProduct[];
};

type ProductDoc = {
  id: string | number;
  productId?: string;
  slug?: string;
};

type SyncOptions = {
  apply: boolean;
  replaceExisting: boolean;
  replaceMedia: boolean;
  replaceVisualGroups: boolean;
};

type DbQuery = (sql: string, params?: unknown[]) => Promise<{ rows?: unknown[] }>;

const payload = extractedProductPayload as ExtractedProductPayload;
const productLocales = ['zh', 'en', 'ru'] as const;

function localized(value: string) {
  return { zh: value, en: value, ru: value };
}

function imageTag(product: ExtractedProduct, imagePath: string) {
  return `extracted-product-image:${product.id}:${imagePath}`;
}

function getDbQuery(payloadClient: Payload): DbQuery {
  const db = (
    payloadClient as unknown as {
      db?: { pool?: { query?: DbQuery } };
    }
  ).db;
  const query = db?.pool?.query?.bind(db.pool);

  if (typeof query !== 'function') {
    throw new Error('Payload database pool is not available for extracted image sync.');
  }

  return query;
}

function unique<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function publicImageToFilePath(publicImagePath: string) {
  const normalized = publicImagePath.replace(/^\/+/, '');
  return path.resolve(process.cwd(), 'public', normalized);
}

function stagedUploadPath(product: ExtractedProduct, sourcePath: string, index: number) {
  const extension = path.extname(sourcePath).toLowerCase() || '.png';
  const safeProductId = product.id.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 120);
  const targetDir = path.resolve(process.cwd(), '.tmp', 'extracted-product-media');
  const targetPath = path.join(
    targetDir,
    `${safeProductId}-${String(index + 1).padStart(3, '0')}${extension}`,
  );

  fs.mkdirSync(targetDir, { recursive: true });

  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size !== fs.statSync(sourcePath).size) {
    fs.copyFileSync(sourcePath, targetPath);
  }

  return targetPath;
}

function mediaDataFor(product: ExtractedProduct, imagePath: string, index: number) {
  const title = `${product.name} 产品图 ${index + 1}`;

  return {
    alt: localized(title),
    caption: localized(title),
    credit: '产品资料',
    folder: 'products',
    tags: [
      { value: imageTag(product, imagePath) },
      { value: 'extracted-product-images' },
      { value: product.id },
      ...(product.model ? [{ value: product.model }] : []),
    ],
    usageCount: 0,
  };
}

async function uploadOrReuseMedia(
  payloadClient: Payload,
  product: ExtractedProduct,
  imagePath: string,
  index: number,
  options: SyncOptions,
) {
  const tag = imageTag(product, imagePath);
  const existing = await payloadClient.find({
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
  const sourcePath = publicImageToFilePath(imagePath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing extracted product image: ${imagePath}`);
  }

  const { zhData, localizedData } = splitLocalizedMediaData(
    mediaDataFor(product, imagePath, index),
  );

  if (!options.apply) {
    return {
      action: existingDoc?.id ? 'reuse' : 'create',
      id: existingDoc?.id ?? `dry-media-${index + 1}`,
    };
  }

  if (existingDoc?.id) {
    await payloadClient.update({
      collection: 'media',
      data: zhData as never,
      depth: 0,
      ...(options.replaceMedia ? { filePath: stagedUploadPath(product, sourcePath, index) } : {}),
      id: existingDoc.id,
      locale: 'zh',
      overrideAccess: true,
    } as never);

    for (const locale of ['en', 'ru'] as const) {
      await payloadClient.update({
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

  const created = (await payloadClient.create({
    collection: 'media',
    data: zhData,
    depth: 0,
    filePath: stagedUploadPath(product, sourcePath, index),
    locale: 'zh',
    overrideAccess: true,
  })) as { id?: string | number };

  for (const locale of ['en', 'ru'] as const) {
    await payloadClient.update({
      collection: 'media',
      data: localizedData[locale] as never,
      depth: 0,
      id: created.id,
      locale,
      overrideAccess: true,
    } as never);
  }

  return { action: 'create', id: created.id as string | number };
}

async function findProducts(payloadClient: Payload) {
  const result = await payloadClient.find({
    collection: 'products',
    depth: 0,
    draft: true,
    locale: 'zh',
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
  });

  const products = result.docs as ProductDoc[];

  return new Map(
    products.flatMap((product) =>
      [product.productId, product.slug]
        .filter((value): value is string => Boolean(value))
        .map((key) => [key, product] as const),
    ),
  );
}

async function hasMainImage(query: DbQuery, productId: string | number) {
  const result = await query('select 1 from products_images where _parent_id = $1 limit 1', [
    productId,
  ]);

  return Boolean(result.rows?.length);
}

async function hasVisualGroups(query: DbQuery, productId: string | number) {
  const result = await query('select 1 from products_visual_groups where _parent_id = $1 limit 1', [
    productId,
  ]);

  return Boolean(result.rows?.length);
}

async function resetMainImageRows(query: DbQuery, productId: string | number) {
  await query('delete from products_images where _parent_id = $1', [productId]);
  await query("delete from products_rels where parent_id = $1 and path like 'images.%'", [
    productId,
  ]);
}

async function resetVisualGroupRows(query: DbQuery, productId: string | number) {
  await query(
    'delete from products_visual_groups_images where _parent_id in (select id from products_visual_groups where _parent_id = $1)',
    [productId],
  );
  await query('delete from products_visual_groups where _parent_id = $1', [productId]);
  await query("delete from products_rels where parent_id = $1 and path like 'visualGroups.%'", [
    productId,
  ]);
}

async function writeProductImages(
  query: DbQuery,
  productId: string | number,
  mediaIds: Array<string | number>,
  options: { writeVisualGroups: boolean },
) {
  await query('begin');

  try {
    await resetMainImageRows(query, productId);

    const mainImage = mediaIds[0];
    if (mainImage) {
      await query('insert into products_images (_order, _parent_id, id) values ($1, $2, $3)', [
        1,
        productId,
        randomBytes(12).toString('hex'),
      ]);
      await query(
        'insert into products_rels ("order", parent_id, path, locale, media_id) values ($1, $2, $3, $4, $5)',
        [null, productId, 'images.0.file', null, mainImage],
      );
    }

    if (options.writeVisualGroups && mediaIds.length > 0) {
      await resetVisualGroupRows(query, productId);

      for (const locale of productLocales) {
        const groupId = randomBytes(12).toString('hex');
        await query(
          'insert into products_visual_groups (_order, _parent_id, _locale, id, variant, title, description) values ($1, $2, $3, $4, $5, $6, $7)',
          [
            1,
            productId,
            locale,
            groupId,
            'gallery',
            locale === 'zh' ? '产品图册' : 'Product gallery',
            locale === 'zh'
              ? '展示产品图片、细节与穿着效果。'
              : 'Shows product images, details, and wearing effect.',
          ],
        );

        for (const [index, mediaId] of mediaIds.entries()) {
          const imageRowId = randomBytes(12).toString('hex');
          await query(
            'insert into products_visual_groups_images (_order, _parent_id, _locale, id) values ($1, $2, $3, $4)',
            [index + 1, groupId, locale, imageRowId],
          );
          await query(
            'insert into products_rels ("order", parent_id, path, locale, media_id) values ($1, $2, $3, $4, $5)',
            [null, productId, `visualGroups.0.images.${index}.file`, locale, mediaId],
          );
        }
      }
    }

    await query('update products set updated_at = now() where id = $1', [productId]);
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
  process.env.REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'seed-revalidate-secret';
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  loadEnvFile(path.resolve(process.cwd(), '.env'));
};

async function initPayloadForSync() {
  setupEnv();
  const [{ default: payloadClient }, secretModule] = await Promise.all([
    import('payload'),
    import('../../src/lib/payload/secret'),
  ]);

  await payloadClient.init({
    local: true,
    secret: secretModule.getPayloadSecret(process.env),
  });

  return payloadClient;
}

export function parseOptions(argv = process.argv): SyncOptions {
  return {
    apply: argv.includes('--apply'),
    replaceExisting: argv.includes('--replace-existing'),
    replaceMedia: argv.includes('--replace-media'),
    replaceVisualGroups: argv.includes('--replace-visual-groups'),
  };
}

export async function syncExtractedProductImages(payloadClient: Payload, options: SyncOptions) {
  const query = getDbQuery(payloadClient);
  const productsByKey = await findProducts(payloadClient);
  const summary = {
    dryRun: !options.apply,
    imagesMissingOnDisk: [] as string[],
    matched: 0,
    mediaCreated: 0,
    mediaReused: 0,
    mediaUpdated: 0,
    productsSkippedWithImage: 0,
    productsUpdated: 0,
    total: payload.products.length,
    unmatched: [] as string[],
  };

  for (const extractedProduct of payload.products) {
    const product = productsByKey.get(extractedProduct.id);

    if (!product) {
      summary.unmatched.push(extractedProduct.id);
      console.warn(`UNMATCHED ${extractedProduct.id}`);
      continue;
    }

    const publicImages = unique(
      [extractedProduct.image, ...(extractedProduct.images ?? [])].filter(
        (value): value is string => Boolean(value),
      ),
    );
    const existingMainImage = await hasMainImage(query, product.id);

    if (existingMainImage && !options.replaceExisting) {
      summary.productsSkippedWithImage += 1;
      continue;
    }

    const existingVisualGroups = await hasVisualGroups(query, product.id);
    const mediaIds: Array<string | number> = [];

    for (const [index, imagePath] of publicImages.entries()) {
      if (!fs.existsSync(publicImageToFilePath(imagePath))) {
        summary.imagesMissingOnDisk.push(imagePath);
        console.warn(`MISSING_FILE ${extractedProduct.id} ${imagePath}`);
        continue;
      }

      const mediaResult = await uploadOrReuseMedia(
        payloadClient,
        extractedProduct,
        imagePath,
        index,
        options,
      );

      if (mediaResult.action === 'create') summary.mediaCreated += 1;
      if (mediaResult.action === 'update') summary.mediaUpdated += 1;
      if (mediaResult.action === 'reuse') summary.mediaReused += 1;

      if (typeof mediaResult.id === 'string' || typeof mediaResult.id === 'number') {
        mediaIds.push(mediaResult.id);
      }
    }

    if (mediaIds.length === 0) {
      continue;
    }

    if (options.apply) {
      await writeProductImages(query, product.id, mediaIds, {
        writeVisualGroups: options.replaceVisualGroups || !existingVisualGroups,
      });
    }

    summary.matched += 1;
    summary.productsUpdated += 1;
    console.log(
      `${options.apply ? 'UPDATED' : 'DRY-UPDATE'} ${extractedProduct.id} -> ${product.id} images=${mediaIds.length}`,
    );
  }

  return summary;
}

const run = async () => {
  const options = parseOptions();
  const payloadClient = await initPayloadForSync();
  const summary = await syncExtractedProductImages(payloadClient, options);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.unmatched.length || summary.imagesMissingOnDisk.length) {
    process.exitCode = 1;
  }
};

const isMain = process.argv[1]
  ? path.basename(process.argv[1]) === 'sync-extracted-product-images.ts'
  : false;

if (isMain) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
