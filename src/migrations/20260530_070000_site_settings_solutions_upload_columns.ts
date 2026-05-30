import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const siteSettingsSolutionsUploadColumnsSql = `
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "logo_light_id" integer;
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "logo_dark_id" integer;
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "default_seo_og_image_id" integer;
ALTER TABLE IF EXISTS "site_settings_socials" ADD COLUMN IF NOT EXISTS "icon_id" integer;

ALTER TABLE IF EXISTS "solutions" ADD COLUMN IF NOT EXISTS "cover_id" integer;
ALTER TABLE IF EXISTS "_solutions_v" ADD COLUMN IF NOT EXISTS "version_cover_id" integer;

UPDATE "site_settings" AS settings
SET "logo_light_id" = settings_rel."media_id"
FROM "site_settings_rels" AS settings_rel
WHERE settings_rel."parent_id" = settings."id"
  AND settings_rel."path" = 'logo.light'
  AND settings_rel."media_id" IS NOT NULL
  AND settings."logo_light_id" IS DISTINCT FROM settings_rel."media_id";

UPDATE "site_settings" AS settings
SET "logo_dark_id" = settings_rel."media_id"
FROM "site_settings_rels" AS settings_rel
WHERE settings_rel."parent_id" = settings."id"
  AND settings_rel."path" = 'logo.dark'
  AND settings_rel."media_id" IS NOT NULL
  AND settings."logo_dark_id" IS DISTINCT FROM settings_rel."media_id";

UPDATE "site_settings" AS settings
SET "default_seo_og_image_id" = settings_rel."media_id"
FROM "site_settings_rels" AS settings_rel
WHERE settings_rel."parent_id" = settings."id"
  AND settings_rel."path" = 'defaultSeo.ogImage'
  AND settings_rel."media_id" IS NOT NULL
  AND settings."default_seo_og_image_id" IS DISTINCT FROM settings_rel."media_id";

UPDATE "site_settings_socials" AS social
SET "icon_id" = settings_rel."media_id"
FROM "site_settings_rels" AS settings_rel
WHERE settings_rel."parent_id" = social."_parent_id"
  AND settings_rel."path" = ('socials.' || (social."_order" - 1)::text || '.icon')
  AND settings_rel."media_id" IS NOT NULL
  AND social."icon_id" IS DISTINCT FROM settings_rel."media_id";

UPDATE "solutions" AS solution
SET "cover_id" = solution_rel."media_id"
FROM "solutions_rels" AS solution_rel
WHERE solution_rel."parent_id" = solution."id"
  AND solution_rel."path" = 'cover'
  AND solution_rel."media_id" IS NOT NULL
  AND solution."cover_id" IS DISTINCT FROM solution_rel."media_id";

UPDATE "_solutions_v" AS solution_version
SET "version_cover_id" = solution_rel."media_id"
FROM "_solutions_v_rels" AS solution_rel
WHERE solution_rel."parent_id" = solution_version."id"
  AND solution_rel."path" = 'cover'
  AND solution_rel."media_id" IS NOT NULL
  AND solution_version."version_cover_id" IS DISTINCT FROM solution_rel."media_id";

DO $$ BEGIN
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_light_id_media_id_fk" FOREIGN KEY ("logo_light_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_dark_id_media_id_fk" FOREIGN KEY ("logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_seo_og_image_id_media_id_fk" FOREIGN KEY ("default_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "site_settings_socials" ADD CONSTRAINT "site_settings_socials_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions" ADD CONSTRAINT "solutions_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "site_settings_logo_light_idx" ON "site_settings" USING btree ("logo_light_id");
CREATE INDEX IF NOT EXISTS "site_settings_logo_dark_idx" ON "site_settings" USING btree ("logo_dark_id");
CREATE INDEX IF NOT EXISTS "site_settings_default_seo_og_image_idx" ON "site_settings" USING btree ("default_seo_og_image_id");
CREATE INDEX IF NOT EXISTS "site_settings_socials_icon_idx" ON "site_settings_socials" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "solutions_cover_idx" ON "solutions" USING btree ("cover_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_version_cover_idx" ON "_solutions_v" USING btree ("version_cover_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(siteSettingsSolutionsUploadColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: site identity and solution covers are public CMS content.
}
