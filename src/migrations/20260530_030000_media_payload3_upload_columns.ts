import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const mediaPayload3UploadColumnsSql = `
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "credit" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "folder" varchar DEFAULT 'misc';
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "usage_count" numeric DEFAULT 0;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "url" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "thumbnail_u_r_l" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "filename" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "mime_type" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "filesize" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "width" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "height" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "focal_x" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "focal_y" numeric;

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_thumbnail_url" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_thumbnail_width" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_thumbnail_height" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_thumbnail_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_thumbnail_filesize" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_thumbnail_filename" varchar;

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_card_url" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_card_width" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_card_height" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_card_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_card_filesize" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_card_filename" varchar;

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_feature_url" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_feature_width" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_feature_height" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_feature_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_feature_filesize" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_feature_filename" varchar;

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_hero_url" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_hero_width" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_hero_height" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_hero_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_hero_filesize" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_hero_filename" varchar;

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_mobile_url" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_mobile_width" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_mobile_height" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_mobile_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_mobile_filesize" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_mobile_filename" varchar;

ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_url" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_width" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_height" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_mime_type" varchar;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filesize" numeric;
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filename" varchar;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(mediaPayload3UploadColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: these columns are Payload 3 upload metadata expected by runtime queries.
}
