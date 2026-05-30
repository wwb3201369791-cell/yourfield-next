import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

const createCmsDynamicContentSql = `
DO $$ BEGIN
  ALTER TYPE "public"."enum_product_categories_group" ADD VALUE IF NOT EXISTS 'water-rescue';
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_solutions_status" AS ENUM('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__solutions_v_version_status" AS ENUM('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "product_groups" (
  "id" serial PRIMARY KEY NOT NULL,
  "group_id" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "show_on_frontend" boolean,
  "order" numeric,
  "seo_noindex" boolean,
  "seo_canonical" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "product_groups_locales" (
  "name" varchar NOT NULL,
  "description" varchar,
  "seo_title" varchar,
  "seo_description" varchar,
  "seo_keywords" varchar,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL,
  CONSTRAINT "product_groups_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "product_groups_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "media_id" integer
);

ALTER TABLE "product_categories" ALTER COLUMN "group" DROP NOT NULL;
ALTER TABLE "product_categories_rels" ADD COLUMN IF NOT EXISTS "product_groups_id" integer;

CREATE TABLE IF NOT EXISTS "solutions_features" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_locale" "_locales" NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "value" varchar
);

CREATE TABLE IF NOT EXISTS "solutions_product_tags" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_locale" "_locales" NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "value" varchar
);

CREATE TABLE IF NOT EXISTS "solutions" (
  "id" serial PRIMARY KEY NOT NULL,
  "solution_id" varchar,
  "slug" varchar,
  "seo_noindex" boolean,
  "seo_canonical" varchar,
  "is_featured" boolean,
  "order" numeric,
  "published_at" timestamp(3) with time zone,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "_status" "enum_solutions_status"
);

CREATE TABLE IF NOT EXISTS "solutions_locales" (
  "title" varchar,
  "summary" varchar,
  "content" jsonb,
  "seo_title" varchar,
  "seo_description" varchar,
  "seo_keywords" varchar,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL,
  CONSTRAINT "solutions_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "solutions_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "media_id" integer,
  "product_groups_id" integer,
  "product_categories_id" integer,
  "products_id" integer
);

CREATE TABLE IF NOT EXISTS "_solutions_v_version_features" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_locale" "_locales" NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "value" varchar,
  "_uuid" varchar
);

CREATE TABLE IF NOT EXISTS "_solutions_v_version_product_tags" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_locale" "_locales" NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "value" varchar,
  "_uuid" varchar
);

CREATE TABLE IF NOT EXISTS "_solutions_v" (
  "id" serial PRIMARY KEY NOT NULL,
  "version_solution_id" varchar,
  "version_slug" varchar,
  "version_seo_noindex" boolean,
  "version_seo_canonical" varchar,
  "version_is_featured" boolean,
  "version_order" numeric,
  "version_published_at" timestamp(3) with time zone,
  "version_updated_at" timestamp(3) with time zone,
  "version_created_at" timestamp(3) with time zone,
  "version__status" "enum__solutions_v_version_status",
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "latest" boolean,
  "autosave" boolean
);

CREATE TABLE IF NOT EXISTS "_solutions_v_locales" (
  "version_title" varchar,
  "version_summary" varchar,
  "version_content" jsonb,
  "version_seo_title" varchar,
  "version_seo_description" varchar,
  "version_seo_keywords" varchar,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL,
  CONSTRAINT "_solutions_v_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "_solutions_v_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "solutions_id" integer,
  "media_id" integer,
  "product_groups_id" integer,
  "product_categories_id" integer,
  "products_id" integer
);

DO $$ BEGIN
  ALTER TABLE "product_groups_locales" ADD CONSTRAINT "product_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_groups_rels" ADD CONSTRAINT "product_groups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_groups_rels" ADD CONSTRAINT "product_groups_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_categories_rels" ADD CONSTRAINT "product_categories_rels_product_groups_fk" FOREIGN KEY ("product_groups_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_features" ADD CONSTRAINT "solutions_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_product_tags" ADD CONSTRAINT "solutions_product_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_locales" ADD CONSTRAINT "solutions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_product_groups_fk" FOREIGN KEY ("product_groups_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_product_categories_fk" FOREIGN KEY ("product_categories_id") REFERENCES "public"."product_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "solutions_rels" ADD CONSTRAINT "solutions_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_version_features" ADD CONSTRAINT "_solutions_v_version_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_version_product_tags" ADD CONSTRAINT "_solutions_v_version_product_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_locales" ADD CONSTRAINT "_solutions_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_solutions_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_solutions_fk" FOREIGN KEY ("solutions_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_product_groups_fk" FOREIGN KEY ("product_groups_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_product_categories_fk" FOREIGN KEY ("product_categories_id") REFERENCES "public"."product_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v_rels" ADD CONSTRAINT "_solutions_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "product_groups_group_id_idx" ON "product_groups" USING btree ("group_id");
CREATE UNIQUE INDEX IF NOT EXISTS "product_groups_slug_idx" ON "product_groups" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "product_groups_show_on_frontend_idx" ON "product_groups" USING btree ("show_on_frontend");
CREATE INDEX IF NOT EXISTS "product_groups_order_idx" ON "product_groups" USING btree ("order");
CREATE INDEX IF NOT EXISTS "product_groups_created_at_idx" ON "product_groups" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "product_groups_rels_order_idx" ON "product_groups_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "product_groups_rels_parent_idx" ON "product_groups_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "product_groups_rels_path_idx" ON "product_groups_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "product_groups_rels_media_id_idx" ON "product_groups_rels" USING btree ("media_id");
CREATE INDEX IF NOT EXISTS "product_categories_rels_product_groups_id_idx" ON "product_categories_rels" USING btree ("product_groups_id");
CREATE INDEX IF NOT EXISTS "solutions_features_order_idx" ON "solutions_features" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "solutions_features_parent_id_idx" ON "solutions_features" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "solutions_features_locale_idx" ON "solutions_features" USING btree ("_locale");
CREATE INDEX IF NOT EXISTS "solutions_product_tags_order_idx" ON "solutions_product_tags" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "solutions_product_tags_parent_id_idx" ON "solutions_product_tags" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "solutions_product_tags_locale_idx" ON "solutions_product_tags" USING btree ("_locale");
CREATE UNIQUE INDEX IF NOT EXISTS "solutions_solution_id_idx" ON "solutions" USING btree ("solution_id");
CREATE UNIQUE INDEX IF NOT EXISTS "solutions_slug_idx" ON "solutions" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "solutions_is_featured_idx" ON "solutions" USING btree ("is_featured");
CREATE INDEX IF NOT EXISTS "solutions_order_idx" ON "solutions" USING btree ("order");
CREATE INDEX IF NOT EXISTS "solutions_created_at_idx" ON "solutions" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "solutions__status_idx" ON "solutions" USING btree ("_status");
CREATE INDEX IF NOT EXISTS "solutions_rels_order_idx" ON "solutions_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "solutions_rels_parent_idx" ON "solutions_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "solutions_rels_path_idx" ON "solutions_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "solutions_rels_media_id_idx" ON "solutions_rels" USING btree ("media_id");
CREATE INDEX IF NOT EXISTS "solutions_rels_product_groups_id_idx" ON "solutions_rels" USING btree ("product_groups_id");
CREATE INDEX IF NOT EXISTS "solutions_rels_product_categories_id_idx" ON "solutions_rels" USING btree ("product_categories_id");
CREATE INDEX IF NOT EXISTS "solutions_rels_products_id_idx" ON "solutions_rels" USING btree ("products_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_features_order_idx" ON "_solutions_v_version_features" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_features_parent_id_idx" ON "_solutions_v_version_features" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_features_locale_idx" ON "_solutions_v_version_features" USING btree ("_locale");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_product_tags_order_idx" ON "_solutions_v_version_product_tags" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_product_tags_parent_id_idx" ON "_solutions_v_version_product_tags" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_product_tags_locale_idx" ON "_solutions_v_version_product_tags" USING btree ("_locale");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_version_solution_id_idx" ON "_solutions_v" USING btree ("version_solution_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_version_slug_idx" ON "_solutions_v" USING btree ("version_slug");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_version_is_featured_idx" ON "_solutions_v" USING btree ("version_is_featured");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_version_order_idx" ON "_solutions_v" USING btree ("version_order");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_version_created_at_idx" ON "_solutions_v" USING btree ("version_created_at");
CREATE INDEX IF NOT EXISTS "_solutions_v_version_version__status_idx" ON "_solutions_v" USING btree ("version__status");
CREATE INDEX IF NOT EXISTS "_solutions_v_created_at_idx" ON "_solutions_v" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "_solutions_v_updated_at_idx" ON "_solutions_v" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "_solutions_v_latest_idx" ON "_solutions_v" USING btree ("latest");
CREATE INDEX IF NOT EXISTS "_solutions_v_autosave_idx" ON "_solutions_v" USING btree ("autosave");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_order_idx" ON "_solutions_v_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_parent_idx" ON "_solutions_v_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_path_idx" ON "_solutions_v_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_solutions_id_idx" ON "_solutions_v_rels" USING btree ("solutions_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_media_id_idx" ON "_solutions_v_rels" USING btree ("media_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_product_groups_id_idx" ON "_solutions_v_rels" USING btree ("product_groups_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_product_categories_id_idx" ON "_solutions_v_rels" USING btree ("product_categories_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_rels_products_id_idx" ON "_solutions_v_rels" USING btree ("products_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(createCmsDynamicContentSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally left blank: this project does not run destructive local rollbacks automatically.
}
