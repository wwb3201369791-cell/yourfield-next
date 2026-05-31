import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productScenarioIdDefaultsSql = `
ALTER TABLE IF EXISTS "products_scenarios"
  ALTER COLUMN "id" SET DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 24);

ALTER TABLE IF EXISTS "_products_v_version_scenarios"
  ALTER COLUMN "id" SET DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 24);
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productScenarioIdDefaultsSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(`
    ALTER TABLE IF EXISTS "products_scenarios"
      ALTER COLUMN "id" DROP DEFAULT;

    ALTER TABLE IF EXISTS "_products_v_version_scenarios"
      ALTER COLUMN "id" DROP DEFAULT;
  `);
}
