export type PayloadMigrationRecord = Readonly<{
  batch?: number | null;
  name?: string | null;
}>;

export type PayloadMigrationRiskSummary = Readonly<{
  devModeSchemaPushRecords: number;
  latestBatch: number | null;
  ok: boolean;
  registeredMigrations: number;
}>;

export function summarizePayloadMigrationRisk(
  migrations: readonly PayloadMigrationRecord[],
): PayloadMigrationRiskSummary {
  const batches = migrations
    .map((migration) => migration.batch)
    .filter((batch): batch is number => typeof batch === 'number' && Number.isFinite(batch));
  const positiveBatches = batches.filter((batch) => batch > 0);
  const devModeSchemaPushRecords = batches.filter((batch) => batch === -1).length;

  return {
    devModeSchemaPushRecords,
    latestBatch: positiveBatches.length > 0 ? Math.max(...positiveBatches) : null,
    ok: devModeSchemaPushRecords === 0,
    registeredMigrations: migrations.length,
  };
}
