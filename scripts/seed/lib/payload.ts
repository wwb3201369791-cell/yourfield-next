import payload from 'payload';

import { getPayloadSecret } from '@/lib/payload/secret';

export const initPayload = async () => {
  await payload.init({
    local: true,
    secret: getPayloadSecret(process.env),
  });

  return payload;
};
