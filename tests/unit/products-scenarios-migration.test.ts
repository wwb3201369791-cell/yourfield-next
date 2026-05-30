import { describe, expect, it, vi } from 'vitest';

import { productScenariosSql, up } from '@/migrations/20260525_000000_products_scenarios';
import {
  productScenariosLocalesSql,
  up as upLocales,
} from '@/migrations/20260529_000000_products_scenarios_locales';

describe('product scenarios migration', () => {
  it('creates the localized product scenario tables used by Payload queries', () => {
    expect(productScenariosSql).toContain('CREATE TABLE IF NOT EXISTS "products_scenarios"');
    expect(productScenariosSql).toContain(
      'CREATE TABLE IF NOT EXISTS "_products_v_version_scenarios"',
    );
    expect(productScenariosSql).toContain('"id" varchar PRIMARY KEY NOT NULL');
    expect(productScenariosSql).not.toContain(
      'CREATE TABLE IF NOT EXISTS "products_scenarios" (\n  "_order" integer NOT NULL,\n  "_parent_id" integer NOT NULL,\n  "_locale" "_locales" NOT NULL,\n  "id" serial PRIMARY KEY NOT NULL',
    );
    expect(productScenariosSql).toContain(
      'ALTER TABLE "products_scenarios" ALTER COLUMN "id" TYPE varchar USING "id"::varchar',
    );
    expect(productScenariosSql).toContain(
      'ALTER TABLE "products_scenarios_locales" DROP CONSTRAINT IF EXISTS "products_scenarios_locales_parent_id_fk"',
    );
    expect(productScenariosSql).toContain(
      'ALTER TABLE "products_scenarios_locales" ALTER COLUMN "_parent_id" TYPE varchar USING "_parent_id"::varchar',
    );
    expect(productScenariosSql).toContain(
      'ALTER TABLE "_products_v_version_scenarios_locales" DROP CONSTRAINT IF EXISTS "_products_v_version_scenarios_locales_parent_id_fk"',
    );
    expect(productScenariosSql).toContain(
      'ALTER TABLE "_products_v_version_scenarios_locales" ALTER COLUMN "_parent_id" TYPE varchar USING "_parent_id"::varchar',
    );
    expect(productScenariosSql).toContain('"title" varchar');
    expect(productScenariosSql).toContain('"description" varchar');
    expect(productScenariosSql).toContain('"_locale" "_locales" NOT NULL');
    expect(productScenariosSql).toContain('"products_scenarios_parent_id_fk"');
    expect(productScenariosSql).toContain('"_products_v_version_scenarios_parent_id_fk"');
  });

  it('creates the localized scenario content tables used by Payload joins', () => {
    expect(productScenariosLocalesSql).toContain(
      'CREATE TABLE IF NOT EXISTS "products_scenarios_locales"',
    );
    expect(productScenariosLocalesSql).toContain(
      'CREATE TABLE IF NOT EXISTS "_products_v_version_scenarios_locales"',
    );
    expect(productScenariosLocalesSql).toContain(
      '"products_scenarios_locales_locale_parent_id_unique"',
    );
    expect(productScenariosLocalesSql).toContain('"products_scenarios_locales_parent_id_fk"');
    expect(productScenariosLocalesSql).toContain(
      '"_products_v_version_scenarios_locales_parent_id_fk"',
    );
    expect(productScenariosLocalesSql).toContain('INSERT INTO "products_scenarios_locales"');
    expect(productScenariosLocalesSql).toContain(
      'ALTER TABLE "products_scenarios" ALTER COLUMN "title" DROP NOT NULL',
    );
  });

  it('runs the migration SQL through the Payload Postgres pool', async () => {
    const query = vi.fn(() => Promise.resolve());

    await up({
      payload: {
        db: {
          pool: { query },
        },
      },
    } as never);

    expect(query).toHaveBeenCalledWith(productScenariosSql);
  });

  it('runs the locale table migration SQL through the Payload Postgres pool', async () => {
    const query = vi.fn(() => Promise.resolve());

    await upLocales({
      payload: {
        db: {
          pool: { query },
        },
      },
    } as never);

    expect(query).toHaveBeenCalledWith(productScenariosLocalesSql);
  });
});
