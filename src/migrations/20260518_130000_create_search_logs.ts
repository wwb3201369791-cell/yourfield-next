import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

const createSearchLogsSql = `
DO $$ BEGIN
 CREATE TYPE "public"."enum_search_logs_event_type" AS ENUM('search', 'result-click');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_search_logs_locale" AS ENUM('zh', 'en', 'ru');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_search_logs_result_type" AS ENUM('product', 'news', 'page', 'faq');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "search_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "eventType" "enum_search_logs_event_type" NOT NULL,
  "query" varchar NOT NULL,
  "locale" "enum_search_logs_locale" NOT NULL,
  "hits" numeric NOT NULL,
  "result_id" varchar,
  "result_title" varchar,
  "resultType" "enum_search_logs_result_type",
  "result_url" varchar,
  "user_id" varchar,
  "ip" varchar NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "search_logs_event_type_idx" ON "search_logs" USING btree ("eventType");
CREATE INDEX IF NOT EXISTS "search_logs_query_idx" ON "search_logs" USING btree ("query");
CREATE INDEX IF NOT EXISTS "search_logs_locale_idx" ON "search_logs" USING btree ("locale");
CREATE INDEX IF NOT EXISTS "search_logs_hits_idx" ON "search_logs" USING btree ("hits");
CREATE INDEX IF NOT EXISTS "search_logs_result_type_idx" ON "search_logs" USING btree ("resultType");
CREATE INDEX IF NOT EXISTS "search_logs_created_at_idx" ON "search_logs" USING btree ("created_at");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(createSearchLogsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally left blank: this project does not run destructive local rollbacks automatically.
}
