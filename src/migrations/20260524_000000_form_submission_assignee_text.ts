import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const formSubmissionAssigneeTextSql = `
ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "assigned_to" varchar;
ALTER TABLE "form_submissions_notes" ADD COLUMN IF NOT EXISTS "user" varchar;

DO $$
BEGIN
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'form_submissions_rels'
    AND column_name = 'users_id'
) THEN
WITH user_labels AS (
  SELECT
    "id",
    COALESCE(NULLIF(TRIM("name"), ''), NULLIF(TRIM("email"), ''), "id"::text) AS "label"
  FROM "users"
)
UPDATE "form_submissions" AS "submission"
SET "assigned_to" = "user_labels"."label"
FROM "form_submissions_rels" AS "rels"
INNER JOIN "user_labels" ON "user_labels"."id" = "rels"."users_id"
WHERE
  "rels"."parent_id" = "submission"."id"
  AND "rels"."path" = 'assignedTo'
  AND "rels"."users_id" IS NOT NULL
  AND (
    "submission"."assigned_to" IS NULL
    OR TRIM("submission"."assigned_to") = ''
    OR TRIM("submission"."assigned_to") ~ '^[0-9]+$'
  );

WITH user_labels AS (
  SELECT
    "id",
    COALESCE(NULLIF(TRIM("name"), ''), NULLIF(TRIM("email"), ''), "id"::text) AS "label"
  FROM "users"
)
UPDATE "form_submissions_notes" AS "note"
SET "user" = "user_labels"."label"
FROM "form_submissions_rels" AS "rels"
INNER JOIN "user_labels" ON "user_labels"."id" = "rels"."users_id"
WHERE
  "rels"."parent_id" = "note"."_parent_id"
  AND "rels"."path" = CONCAT('notes.', "note"."_order" - 1, '.user')
  AND "rels"."users_id" IS NOT NULL
  AND (
    "note"."user" IS NULL
    OR TRIM("note"."user") = ''
    OR TRIM("note"."user") ~ '^[0-9]+$'
  );
END IF;
END $$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(formSubmissionAssigneeTextSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive by design: old relationship rows are left in place, but text cannot be
  // converted back to stable user IDs automatically after humans may edit the assignee names.
}
