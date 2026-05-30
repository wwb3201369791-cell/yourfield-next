import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productsUploadFieldColumnsSql = `
ALTER TABLE IF EXISTS "products_images" ADD COLUMN IF NOT EXISTS "file_id" integer;
ALTER TABLE IF EXISTS "products_visual_groups_images" ADD COLUMN IF NOT EXISTS "file_id" integer;
ALTER TABLE IF EXISTS "products_selling_points" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "products_certifications" ADD COLUMN IF NOT EXISTS "attachment_id" integer;
ALTER TABLE IF EXISTS "products_quality_evidence" ADD COLUMN IF NOT EXISTS "attachment_id" integer;

ALTER TABLE IF EXISTS "_products_v_version_images" ADD COLUMN IF NOT EXISTS "file_id" integer;
ALTER TABLE IF EXISTS "_products_v_version_visual_groups_images" ADD COLUMN IF NOT EXISTS "file_id" integer;
ALTER TABLE IF EXISTS "_products_v_version_selling_points" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "_products_v_version_certifications" ADD COLUMN IF NOT EXISTS "attachment_id" integer;
ALTER TABLE IF EXISTS "_products_v_version_quality_evidence" ADD COLUMN IF NOT EXISTS "attachment_id" integer;

UPDATE "products_images" AS product_image
SET "file_id" = product_rel."media_id"
FROM "products_rels" AS product_rel
WHERE product_rel."parent_id" = product_image."_parent_id"
  AND product_rel."path" = ('images.' || (product_image."_order" - 1)::text || '.file')
  AND product_rel."media_id" IS NOT NULL
  AND product_image."file_id" IS DISTINCT FROM product_rel."media_id";

UPDATE "products_visual_groups_images" AS group_image
SET "file_id" = product_rel."media_id"
FROM "products_visual_groups" AS visual_group,
  "products_rels" AS product_rel
WHERE visual_group."id" = group_image."_parent_id"
  AND product_rel."parent_id" = visual_group."_parent_id"
  AND product_rel."locale" = group_image."_locale"
  AND product_rel."path" = (
    'visualGroups.'
    || (visual_group."_order" - 1)::text
    || '.images.'
    || (group_image."_order" - 1)::text
    || '.file'
  )
  AND product_rel."media_id" IS NOT NULL
  AND group_image."file_id" IS DISTINCT FROM product_rel."media_id";

UPDATE "_products_v_version_images" AS product_image
SET "file_id" = product_rel."media_id"
FROM "_products_v_rels" AS product_rel
WHERE product_rel."parent_id" = product_image."_parent_id"
  AND product_rel."path" = ('images.' || (product_image."_order" - 1)::text || '.file')
  AND product_rel."media_id" IS NOT NULL
  AND product_image."file_id" IS DISTINCT FROM product_rel."media_id";

UPDATE "_products_v_version_visual_groups_images" AS group_image
SET "file_id" = product_rel."media_id"
FROM "_products_v_version_visual_groups" AS visual_group,
  "_products_v_rels" AS product_rel
WHERE visual_group."id" = group_image."_parent_id"
  AND product_rel."parent_id" = visual_group."_parent_id"
  AND product_rel."locale" = group_image."_locale"
  AND product_rel."path" = (
    'visualGroups.'
    || (visual_group."_order" - 1)::text
    || '.images.'
    || (group_image."_order" - 1)::text
    || '.file'
  )
  AND product_rel."media_id" IS NOT NULL
  AND group_image."file_id" IS DISTINCT FROM product_rel."media_id";

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products_images'
  ) AND NOT EXISTS (SELECT 1 FROM "products_images" WHERE "file_id" IS NULL) THEN
    ALTER TABLE "products_images" ALTER COLUMN "file_id" SET NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products_visual_groups_images'
  ) AND NOT EXISTS (SELECT 1 FROM "products_visual_groups_images" WHERE "file_id" IS NULL) THEN
    ALTER TABLE "products_visual_groups_images" ALTER COLUMN "file_id" SET NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE "products_images" ADD CONSTRAINT "products_images_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "products_visual_groups_images" ADD CONSTRAINT "products_visual_groups_images_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "products_selling_points" ADD CONSTRAINT "products_selling_points_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "products_certifications" ADD CONSTRAINT "products_certifications_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "products_quality_evidence" ADD CONSTRAINT "products_quality_evidence_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v_version_images" ADD CONSTRAINT "_products_v_version_images_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v_version_visual_groups_images" ADD CONSTRAINT "_products_v_version_visual_groups_images_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v_version_selling_points" ADD CONSTRAINT "_products_v_version_selling_points_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v_version_certifications" ADD CONSTRAINT "_products_v_version_certifications_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v_version_quality_evidence" ADD CONSTRAINT "_products_v_version_quality_evidence_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "products_images_file_idx" ON "products_images" USING btree ("file_id");
CREATE INDEX IF NOT EXISTS "products_visual_groups_images_file_idx" ON "products_visual_groups_images" USING btree ("file_id");
CREATE INDEX IF NOT EXISTS "products_selling_points_icon_idx" ON "products_selling_points" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "products_certifications_attachment_idx" ON "products_certifications" USING btree ("attachment_id");
CREATE INDEX IF NOT EXISTS "products_quality_evidence_attachment_idx" ON "products_quality_evidence" USING btree ("attachment_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_images_file_idx" ON "_products_v_version_images" USING btree ("file_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_visual_groups_images_file_idx" ON "_products_v_version_visual_groups_images" USING btree ("file_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_selling_points_icon_idx" ON "_products_v_version_selling_points" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_certifications_attachment_idx" ON "_products_v_version_certifications" USING btree ("attachment_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_quality_evidence_attachment_idx" ON "_products_v_version_quality_evidence" USING btree ("attachment_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productsUploadFieldColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: product image and attachment relations are public CMS content.
}
