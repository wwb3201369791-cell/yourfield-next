import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (sql: string, params?: unknown[]) => Promise<unknown>;
    };
  };
};

export const legacyCamelCaseColumnsCompatibilitySql = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'form_submissions'
      AND column_name = 'inquiryType'
  ) THEN
    ALTER TABLE "form_submissions" ALTER COLUMN "inquiryType" DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'search_logs'
      AND column_name = 'eventType'
  ) THEN
    ALTER TABLE "search_logs" ALTER COLUMN "eventType" DROP NOT NULL;
  END IF;
END $$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(
    legacyCamelCaseColumnsCompatibilitySql,
  );
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Non-destructive rollback: keep legacy columns nullable so Payload 3 inserts continue to work.
  await (payload as unknown as PayloadWithPgPool).db.pool.query('SELECT 1');
}
