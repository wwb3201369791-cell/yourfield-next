import { importLegacyMedia } from './import-legacy-media';
import { initPayload } from './lib/payload';

const run = async () => {
  const payload = await initPayload();
  const media = await importLegacyMedia(payload, { skipExisting: false });

  console.log(
    JSON.stringify(
      {
        media: {
          created: media.created,
          skipped: media.skipped,
          updated: media.updated,
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
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
