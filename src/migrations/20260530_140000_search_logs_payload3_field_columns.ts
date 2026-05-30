import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const searchLogsPayload3FieldColumnsSql = `
ALTER TABLE IF EXISTS "search_logs" ADD COLUMN IF NOT EXISTS "event_type" "enum_search_logs_event_type";
ALTER TABLE IF EXISTS "search_logs" ADD COLUMN IF NOT EXISTS "result_type" "enum_search_logs_result_type";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'search_logs'
      AND column_name = 'eventType'
  ) THEN
    UPDATE "search_logs"
    SET "event_type" = "eventType"
    WHERE "event_type" IS NULL
      AND "eventType" IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'search_logs'
      AND column_name = 'resultType'
  ) THEN
    UPDATE "search_logs"
    SET "result_type" = "resultType"
    WHERE "result_type" IS NULL
      AND "resultType" IS NOT NULL;
  END IF;
END $$;

UPDATE "search_logs"
SET "event_type" = 'search'
WHERE "event_type" IS NULL;

ALTER TABLE IF EXISTS "search_logs" ALTER COLUMN "event_type" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "search_logs_event_type_v3_idx" ON "search_logs" USING btree ("event_type");
CREATE INDEX IF NOT EXISTS "search_logs_result_type_v3_idx" ON "search_logs" USING btree ("result_type");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(searchLogsPayload3FieldColumnsSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Non-destructive rollback: search logs are analytics data and should not be removed.
  await (payload as unknown as PayloadWithPgPool).db.pool.query('SELECT 1');
}
