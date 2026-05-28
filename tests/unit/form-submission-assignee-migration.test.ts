import { describe, expect, it, vi } from 'vitest';

import {
  formSubmissionAssigneeTextSql,
  up,
} from '@/migrations/20260524_000000_form_submission_assignee_text';

describe('form submission assignee text migration', () => {
  it('copies old assignee relationships into the new text columns', () => {
    expect(formSubmissionAssigneeTextSql).toContain(
      'ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "assigned_to" varchar',
    );
    expect(formSubmissionAssigneeTextSql).toContain(
      'ALTER TABLE "form_submissions_notes" ADD COLUMN IF NOT EXISTS "user" varchar',
    );
    expect(formSubmissionAssigneeTextSql).toContain('"form_submissions_rels"');
    expect(formSubmissionAssigneeTextSql).toContain('"rels"."path" = \'assignedTo\'');
    expect(formSubmissionAssigneeTextSql).toContain(
      'CONCAT(\'notes.\', "note"."_order" - 1, \'.user\')',
    );
    expect(formSubmissionAssigneeTextSql).toContain(
      'COALESCE(NULLIF(TRIM("name"), \'\'), NULLIF(TRIM("email"), \'\'), "id"::text)',
    );
  });

  it('runs the migration SQL through the Payload Postgres pool', async () => {
    const query = vi.fn(async () => undefined);

    await up({
      payload: {
        db: {
          pool: {
            query,
          },
        },
      },
    } as never);

    expect(query).toHaveBeenCalledWith(formSubmissionAssigneeTextSql);
  });
});
