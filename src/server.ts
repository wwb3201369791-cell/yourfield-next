import path from 'path';

import express from 'express';
import next from 'next';
import { getPayload } from 'payload';

import { seedSuperadmin } from '../scripts/seed/seed-superadmin';

import { loadLocalEnv } from './lib/loadEnvFile';
import { createPayloadPrivateRouteProtection } from './lib/payload/privateRouteProtection';

async function start() {
  loadLocalEnv();
  const [{ env }, { default: payloadConfig }] = await Promise.all([
    import('./lib/env'),
    import('./payload.config'),
  ]);
  const app = express();
  const nextApp = next({ dev: env.NODE_ENV !== 'production' });
  const nextHandler = nextApp.getRequestHandler();

  app.disable('x-powered-by');

  const inlineMediaContentTypePattern =
    /^(image|video|audio|font)\/|^text\/css\b|^application\/javascript\b|^text\/javascript\b|^application\/json\b/i;

  function sanitizeAttachmentFilename(value: string) {
    return value.replace(/["\r\n]+/g, '');
  }

  function setUploadedMediaHeaders(res: express.Response, filePath: string) {
    const headerContentType = res.getHeader('Content-Type');
    const contentType =
      typeof headerContentType === 'string'
        ? headerContentType
        : Array.isArray(headerContentType)
          ? (headerContentType[0] ?? '')
          : '';

    if (!inlineMediaContentTypePattern.test(contentType)) {
      const safeName = sanitizeAttachmentFilename(path.basename(filePath));
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    }
  }

  // eslint-disable-next-line import/no-named-as-default-member -- Express exposes static middleware on the default export.
  const uploadedMediaStatic = express.static(path.resolve(process.cwd(), 'src/uploads'), {
    immutable: env.NODE_ENV === 'production',
    maxAge: env.NODE_ENV === 'production' ? '30d' : 0,
    setHeaders: setUploadedMediaHeaders,
  });

  app.use('/media/file', uploadedMediaStatic);
  app.use('/media', uploadedMediaStatic);
  app.use(createPayloadPrivateRouteProtection(env));

  if (env.NODE_ENV !== 'production') {
    if (env.SUPERADMIN_EMAIL && env.SUPERADMIN_PASSWORD) {
      const payload = await getPayload({ config: payloadConfig });
      const result = await seedSuperadmin(payload, { skipExisting: true });
      console.warn('[seed] local super-admin ready', {
        email: env.SUPERADMIN_EMAIL,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      });
    } else {
      console.warn(
        '[seed] SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD missing; /admin may show first-user setup.',
      );
    }
  }

  await nextApp.prepare();

  app.use((request, response) => {
    void nextHandler(request, response);
  });

  app.listen(env.PORT, () => {
    console.warn(`YourField Next + Payload is running at ${env.PAYLOAD_PUBLIC_SERVER_URL}`);
  });
}

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
