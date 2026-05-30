import { getPayload } from 'payload';

import config from '@/payload.config';

export const initPayload = async () => {
  return getPayload({ config });
};
