import { getPayload } from 'payload';

import configPromise from '../src/payload.config';

import {
  summarizePayloadMigrationRisk,
  type PayloadMigrationRecord,
} from './lib/payloadMigrationRisk';

async function main() {
  const payload = await getPayload({ config: configPromise });
  const migrations = (await payload.find({
    collection: 'payload-migrations' as never,
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    sort: '-batch',
  })) as { docs?: PayloadMigrationRecord[] };
  const summary = summarizePayloadMigrationRisk(migrations.docs ?? []);

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    console.error(
      'Unsafe Payload migration state: dev-mode dynamic schema push records exist (batch=-1). Do not run payload:migrate non-interactively.',
    );
  }

  setTimeout(() => process.exit(summary.ok ? 0 : 2), 50);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
