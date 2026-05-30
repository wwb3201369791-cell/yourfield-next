import { importLegacyMedia } from './import-legacy-media';
import { importLegacyNews } from './import-legacy-news';
import { initPayload } from './lib/payload';

const formatError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return error;
  }

  const details = (error as { data?: unknown }).data;

  return details ? `${error.message} ${JSON.stringify(details)}` : error.message;
};

const run = async () => {
  const payload = await initPayload();
  const media = await importLegacyMedia(payload, { skipExisting: true });
  const news = await importLegacyNews(payload, { skipExisting: false }, media.manifest);

  console.log(
    JSON.stringify({
      media: {
        created: media.created,
        updated: media.updated,
        skipped: media.skipped,
      },
      news,
    }),
  );
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(formatError(error));
    process.exit(1);
  });
