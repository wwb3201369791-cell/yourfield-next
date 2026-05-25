import payload from 'payload';

import { env } from '@/lib/env';
import { getPayloadSecret } from '@/lib/payload/secret';
import config from '@/payload.config';

let payloadPromise: Promise<typeof payload> | null = null;

export async function getPayloadClient() {
  payloadPromise ??= payload
    .init({
      config,
      local: true,
      secret: getPayloadSecret(env),
    })
    .then(() => payload);

  return payloadPromise;
}
