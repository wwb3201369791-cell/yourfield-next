import { describe, expect, it, vi } from 'vitest';

import {
  legacyCamelCaseColumnsCompatibilitySql,
  up,
} from '@/migrations/20260601_000000_payload3_legacy_camelcase_columns';

describe('Payload 3 legacy camelCase column compatibility migration', () => {
  it('relaxes legacy form submission columns that Payload 3 no longer writes', () => {
    expect(legacyCamelCaseColumnsCompatibilitySql).toContain("table_name = 'form_submissions'");
    expect(legacyCamelCaseColumnsCompatibilitySql).toContain("column_name = 'inquiryType'");
    expect(legacyCamelCaseColumnsCompatibilitySql).toContain(
      'ALTER TABLE "form_submissions" ALTER COLUMN "inquiryType" DROP NOT NULL',
    );
  });

  it('relaxes legacy search log columns that Payload 3 no longer writes', () => {
    expect(legacyCamelCaseColumnsCompatibilitySql).toContain("table_name = 'search_logs'");
    expect(legacyCamelCaseColumnsCompatibilitySql).toContain("column_name = 'eventType'");
    expect(legacyCamelCaseColumnsCompatibilitySql).toContain(
      'ALTER TABLE "search_logs" ALTER COLUMN "eventType" DROP NOT NULL',
    );
  });

  it('runs through the Payload Postgres pool', async () => {
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

    expect(query).toHaveBeenCalledWith(legacyCamelCaseColumnsCompatibilitySql);
  });
});
