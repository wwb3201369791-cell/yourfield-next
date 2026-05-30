import { importLegacyCategories } from './import-legacy-categories';
import { importLegacyMedia } from './import-legacy-media';
import { importProductGroups } from './import-product-groups';
import { initPayload } from './lib/payload';
import { parseSeedOptions } from './lib/shared';

const run = async () => {
  const options = parseSeedOptions();
  const payload = await initPayload();
  const before = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 0,
    overrideAccess: true,
  });
  const productGroups = await importProductGroups(payload, options);
  const categories = await importLegacyCategories(payload, options);
  const media = await importLegacyMedia(payload, options);
  const after = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 0,
    overrideAccess: true,
  });

  console.log(
    JSON.stringify(
      {
        before: before.totalDocs,
        after: after.totalDocs,
        productGroups,
        categories,
        media: {
          created: media.created,
          updated: media.updated,
          skipped: media.skipped,
        },
      },
      null,
      2,
    ),
  );
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('[seed:products] failed', error);
    process.exit(1);
  });
