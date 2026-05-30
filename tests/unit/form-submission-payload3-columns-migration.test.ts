import { describe, expect, it, vi } from 'vitest';

import {
  formSubmissionPayload3ColumnsSql,
  up,
} from '@/migrations/20260530_190000_form_submissions_payload3_columns';

describe('form submission Payload 3 columns migration', () => {
  it('adds direct Payload 3 columns for list filters and product relationships', () => {
    expect(formSubmissionPayload3ColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "form_submissions" ADD COLUMN IF NOT EXISTS "inquiry_type" "enum_form_submissions_inquiry_type"',
    );
    expect(formSubmissionPayload3ColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "form_submissions" ADD COLUMN IF NOT EXISTS "source_locale" "enum_form_submissions_source_locale"',
    );
    expect(formSubmissionPayload3ColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "form_submissions" ADD COLUMN IF NOT EXISTS "product_ref_id" integer',
    );
  });

  it('backfills snake_case columns from legacy camelCase fields and relation rows', () => {
    expect(formSubmissionPayload3ColumnsSql).toContain("column_name = 'inquiryType'");
    expect(formSubmissionPayload3ColumnsSql).toContain('SET "inquiry_type" = "inquiryType"');
    expect(formSubmissionPayload3ColumnsSql).toContain('SET "inquiry_type" = \'message\'');
    expect(formSubmissionPayload3ColumnsSql).toContain('ALTER COLUMN "inquiry_type" SET NOT NULL');
    expect(formSubmissionPayload3ColumnsSql).toContain("column_name = 'sourceLocale'");
    expect(formSubmissionPayload3ColumnsSql).toContain('SET "source_locale" = "sourceLocale"');
    expect(formSubmissionPayload3ColumnsSql).toContain('FROM "form_submissions_rels"');
    expect(formSubmissionPayload3ColumnsSql).toContain('"path" = \'productRef\'');
    expect(formSubmissionPayload3ColumnsSql).toContain('"products_id" IS NOT NULL');
    expect(formSubmissionPayload3ColumnsSql).toContain('SET "product_ref_id" = rel."products_id"');
  });

  it('creates direct indexes and a non-destructive product foreign key', () => {
    expect(formSubmissionPayload3ColumnsSql).toContain(
      'CREATE INDEX IF NOT EXISTS "form_submissions_inquiry_type_v3_idx"',
    );
    expect(formSubmissionPayload3ColumnsSql).toContain(
      'CREATE INDEX IF NOT EXISTS "form_submissions_product_ref_idx"',
    );
    expect(formSubmissionPayload3ColumnsSql).toContain(
      'form_submissions_product_ref_id_products_id_fk',
    );
    expect(formSubmissionPayload3ColumnsSql).toContain('ON DELETE set null');
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

    expect(query).toHaveBeenCalledWith(formSubmissionPayload3ColumnsSql);
  });
});
