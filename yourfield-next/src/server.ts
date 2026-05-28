import fs from 'fs';
import path from 'path';

import express from 'express';
import next from 'next';
import payload from 'payload';

import { seedSuperadmin } from '../scripts/seed/seed-superadmin';

import { adminRedirectTarget, createExactAdminRedirectPattern } from './lib/payload/adminRedirect';
import { getPayloadSecret } from './lib/payload/secret';

function parseEnvValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) {
      continue;
    }

    const key = match[1];
    const rawValue = match[2];
    if (!key || rawValue === undefined) {
      continue;
    }

    // eslint-disable-next-line no-restricted-syntax -- Load .env.local before the validated env module is imported.
    process.env[key] ??= parseEnvValue(rawValue);
  }
}

function loadLocalEnv() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, '.env.local'));
  loadEnvFile(path.join(cwd, '.env'));
}

async function start() {
  loadLocalEnv();
  const { env } = await import('./lib/env');
  const app = express();
  const nextApp = next({ dev: env.NODE_ENV !== 'production' });
  const nextHandler = nextApp.getRequestHandler();

  await payload.init({
    secret: getPayloadSecret(env),
    express: app,
  });

  // eslint-disable-next-line import/no-named-as-default-member -- Express exposes static middleware on the default export.
  const uploadedMediaStatic = express.static(path.resolve(process.cwd(), 'src/uploads'), {
    immutable: env.NODE_ENV === 'production',
    maxAge: env.NODE_ENV === 'production' ? '30d' : 0,
  });

  app.use('/media', uploadedMediaStatic);

  if (env.NODE_ENV !== 'production') {
    if (env.SUPERADMIN_EMAIL && env.SUPERADMIN_PASSWORD) {
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

  app.get(createExactAdminRedirectPattern(env.PAYLOAD_PUBLIC_ADMIN_PATH), (request, response) => {
    response.redirect(
      308,
      adminRedirectTarget(env.PAYLOAD_PUBLIC_ADMIN_PATH, request.originalUrl) ??
        `${env.PAYLOAD_PUBLIC_ADMIN_PATH}/`,
    );
  });

  app.all('*', (request, response) => {
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
