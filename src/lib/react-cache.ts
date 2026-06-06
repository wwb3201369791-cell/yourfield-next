import { cache } from 'react';

import { env } from '@/lib/env';

const passThroughReactCache = (<T extends (...args: never[]) => unknown>(fn: T) =>
  fn) as typeof cache;

export const reactCacheOrPassThrough: typeof cache =
  env.NODE_ENV === 'production' && typeof cache === 'function' ? cache : passThroughReactCache;
