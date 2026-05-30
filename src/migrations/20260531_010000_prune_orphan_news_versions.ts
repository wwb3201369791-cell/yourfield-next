import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const pruneOrphanNewsVersionsSql = `
DELETE FROM "_news_v" AS news_version
WHERE news_version."parent_id" IS NULL;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(pruneOrphanNewsVersionsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive rollback: deleted version rows had no live news parent and rendered as /news/null admin ghosts.
}
