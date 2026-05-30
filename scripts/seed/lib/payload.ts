import { getPayload } from 'payload';

import { loadLocalEnv } from '@/lib/loadEnvFile';

export const initPayload = async () => {
  loadLocalEnv();
  const { default: config } = await import('@/payload.config');

  return getPayload({ config });
};
