import { describe, expect, it } from 'vitest';

import {
  productionBuildDatabasePoolMaxLimit,
  resolvePayloadDatabasePoolMax,
} from '@/lib/payload/databasePool';

describe('Payload database pool sizing', () => {
  it('keeps the configured pool size outside production builds', () => {
    expect(resolvePayloadDatabasePoolMax(10, { isProductionBuild: false })).toBe(10);
  });

  it('caps production build pool size without starving one-page CMS reads', () => {
    expect(resolvePayloadDatabasePoolMax(10, { isProductionBuild: true })).toBe(
      productionBuildDatabasePoolMaxLimit,
    );
    expect(productionBuildDatabasePoolMaxLimit).toBeGreaterThanOrEqual(6);
  });
});
