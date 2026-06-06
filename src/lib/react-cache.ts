import { cache } from 'react';

const passThroughReactCache = (<T extends (...args: never[]) => unknown>(fn: T) =>
  fn) as typeof cache;

export const reactCacheOrPassThrough: typeof cache =
  typeof cache === 'function' ? cache : passThroughReactCache;
