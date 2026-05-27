import { describe, expect, it, vi } from 'vitest';

import {
  productScenariosSql,
  up,
} from '@/migrations/20260525_000000_products_scenarios';

describe('product scenarios migration', () => {
  it('creates the localized product scenario tables used by Payload queries', () => {
    expect(productScenariosSql).toContain('CREATE TABLE IF NOT EXISTS "products_scenarios"');
    expect(productScenariosSql).toContain('CREATE TABLE IF NOT EXISTS "_products_v_version_scenarios"');
    expect(productScenariosSql).toContain('"id" varchar PRIMARY KEY NOT NULL');
    expect(productScenariosSql).not.toContain('CREATE TABLE IF NOT EXISTS "products_scenarios" (\n  "_order" integer NOT NULL,\n  "_parent_id" integer NOT NULL,\n  "_locale" "_locales" NOT NULL,\n  "id" serial PRIMARY KEY NOT NULL');
    expect(productScenariosSql).toContain('ALTER TABLE "products_scenarios" ALTER COLUMN "id" TYPE varchar USING "id"::varchar');
    expect(productScenariosSql).toContain('"title" varchar');
    expect(productScenariosSql).toContain('"description" varchar');
    expect(productScenariosSql).toContain('"_locale" "_locales" NOT NULL');
    expect(productScenariosSql).toContain('"products_scenarios_parent_id_fk"');
    expect(productScenariosSql).toContain('"_products_v_version_scenarios_parent_id_fk"');
  });

  it('runs the migration SQL through the Payload Postgres pool', async () => {
    const query = vi.fn(async () => undefined);

    await up({
      payload: {
        db: {
          pool: { query },
        },
      },
    } as never);

    expect(query).toHaveBeenCalledWith(productScenariosSql);
  });
});
