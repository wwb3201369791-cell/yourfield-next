import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const navigationIconColumnsSql = `
ALTER TABLE IF EXISTS "navigation_main_nav" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "navigation_main_nav_children" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "navigation_footer_nav_items" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "navigation_footer_nav_items_children" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "navigation_mobile_nav" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "navigation_mobile_nav_children" ADD COLUMN IF NOT EXISTS "icon_id" integer;

UPDATE "navigation_main_nav" AS item
SET "icon_id" = rel."media_id"
FROM "navigation_rels" AS rel
WHERE rel."parent_id" = item."_parent_id"
  AND rel."path" = ('mainNav.' || (item."_order" - 1)::text || '.icon')
  AND rel."media_id" IS NOT NULL
  AND item."icon_id" IS DISTINCT FROM rel."media_id";

UPDATE "navigation_main_nav_children" AS child
SET "icon_id" = rel."media_id"
FROM "navigation_main_nav" AS item,
  "navigation_rels" AS rel
WHERE item."id" = child."_parent_id"
  AND rel."parent_id" = item."_parent_id"
  AND rel."path" = (
    'mainNav.'
    || (item."_order" - 1)::text
    || '.children.'
    || (child."_order" - 1)::text
    || '.icon'
  )
  AND rel."media_id" IS NOT NULL
  AND child."icon_id" IS DISTINCT FROM rel."media_id";

UPDATE "navigation_footer_nav_items" AS item
SET "icon_id" = rel."media_id"
FROM "navigation_footer_nav" AS footer_group,
  "navigation_rels" AS rel
WHERE footer_group."id" = item."_parent_id"
  AND rel."parent_id" = footer_group."_parent_id"
  AND rel."path" = (
    'footerNav.'
    || (footer_group."_order" - 1)::text
    || '.items.'
    || (item."_order" - 1)::text
    || '.icon'
  )
  AND rel."media_id" IS NOT NULL
  AND item."icon_id" IS DISTINCT FROM rel."media_id";

UPDATE "navigation_footer_nav_items_children" AS child
SET "icon_id" = rel."media_id"
FROM "navigation_footer_nav_items" AS item,
  "navigation_footer_nav" AS footer_group,
  "navigation_rels" AS rel
WHERE item."id" = child."_parent_id"
  AND footer_group."id" = item."_parent_id"
  AND rel."parent_id" = footer_group."_parent_id"
  AND rel."path" = (
    'footerNav.'
    || (footer_group."_order" - 1)::text
    || '.items.'
    || (item."_order" - 1)::text
    || '.children.'
    || (child."_order" - 1)::text
    || '.icon'
  )
  AND rel."media_id" IS NOT NULL
  AND child."icon_id" IS DISTINCT FROM rel."media_id";

UPDATE "navigation_mobile_nav" AS item
SET "icon_id" = rel."media_id"
FROM "navigation_rels" AS rel
WHERE rel."parent_id" = item."_parent_id"
  AND rel."path" = ('mobileNav.' || (item."_order" - 1)::text || '.icon')
  AND rel."media_id" IS NOT NULL
  AND item."icon_id" IS DISTINCT FROM rel."media_id";

UPDATE "navigation_mobile_nav_children" AS child
SET "icon_id" = rel."media_id"
FROM "navigation_mobile_nav" AS item,
  "navigation_rels" AS rel
WHERE item."id" = child."_parent_id"
  AND rel."parent_id" = item."_parent_id"
  AND rel."path" = (
    'mobileNav.'
    || (item."_order" - 1)::text
    || '.children.'
    || (child."_order" - 1)::text
    || '.icon'
  )
  AND rel."media_id" IS NOT NULL
  AND child."icon_id" IS DISTINCT FROM rel."media_id";

DO $$ BEGIN
  ALTER TABLE "navigation_main_nav" ADD CONSTRAINT "navigation_main_nav_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_main_nav_children" ADD CONSTRAINT "navigation_main_nav_children_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_footer_nav_items" ADD CONSTRAINT "navigation_footer_nav_items_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_footer_nav_items_children" ADD CONSTRAINT "navigation_footer_nav_items_children_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_mobile_nav" ADD CONSTRAINT "navigation_mobile_nav_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "navigation_mobile_nav_children" ADD CONSTRAINT "navigation_mobile_nav_children_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "navigation_main_nav_icon_idx" ON "navigation_main_nav" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "navigation_main_nav_children_icon_idx" ON "navigation_main_nav_children" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "navigation_footer_nav_items_icon_idx" ON "navigation_footer_nav_items" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "navigation_footer_nav_items_children_icon_idx" ON "navigation_footer_nav_items_children" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "navigation_mobile_nav_icon_idx" ON "navigation_mobile_nav" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "navigation_mobile_nav_children_icon_idx" ON "navigation_mobile_nav_children" USING btree ("icon_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(navigationIconColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: navigation icons are public CMS content.
}
