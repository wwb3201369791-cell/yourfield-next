import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const usersPayload3AuthColumnsSql = `
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "role_id" integer;

UPDATE "users" AS user_doc
SET "role_id" = user_rel."roles_id"
FROM "users_rels" AS user_rel
WHERE user_rel."parent_id" = user_doc."id"
  AND user_rel."path" = 'role'
  AND user_rel."roles_id" IS NOT NULL
  AND user_doc."role_id" IS DISTINCT FROM user_rel."roles_id";

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role_id");

CREATE TABLE IF NOT EXISTS "users_sessions" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "expires_at" timestamp with time zone NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(usersPayload3AuthColumnsSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Non-destructive rollback: role assignments and active sessions are authentication data.
  await (payload as unknown as PayloadWithPgPool).db.pool.query('SELECT 1');
}
