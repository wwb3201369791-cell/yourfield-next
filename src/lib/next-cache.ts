import { unstable_cache } from 'next/cache';

const passThroughUnstableCache = ((fn: Parameters<typeof unstable_cache>[0]) =>
  fn) as typeof unstable_cache;

export const unstableCacheOrPassThrough: typeof unstable_cache =
  typeof unstable_cache === 'function' ? unstable_cache : passThroughUnstableCache;
