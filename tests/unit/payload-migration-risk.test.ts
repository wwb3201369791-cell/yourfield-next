import { describe, expect, it } from 'vitest';

import { summarizePayloadMigrationRisk } from '../../scripts/lib/payloadMigrationRisk';

describe('summarizePayloadMigrationRisk', () => {
  it('fails closed when Payload recorded a dev-mode dynamic schema push', () => {
    const summary = summarizePayloadMigrationRisk([
      { batch: 24, name: '20260604_001500_site_settings_seo_verification' },
      { batch: -1, name: 'payload-dev-schema-push' },
    ]);

    expect(summary).toMatchObject({
      devModeSchemaPushRecords: 1,
      latestBatch: 24,
      ok: false,
      registeredMigrations: 2,
    });
  });

  it('passes when all registered migrations use normal positive batches', () => {
    const summary = summarizePayloadMigrationRisk([
      { batch: 24, name: '20260604_001500_site_settings_seo_verification' },
      { batch: 25, name: '20260605_001000_backfill_hyf9905_specification_i18n' },
    ]);

    expect(summary).toMatchObject({
      devModeSchemaPushRecords: 0,
      latestBatch: 25,
      ok: true,
      registeredMigrations: 2,
    });
  });
});
