import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const siteSettingsSeoVerificationSql = `
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "seo_verification_google_site_verification" varchar;
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "seo_verification_baidu_site_verification" varchar;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(siteSettingsSeoVerificationSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: search-engine verification tokens are public site settings.
}
