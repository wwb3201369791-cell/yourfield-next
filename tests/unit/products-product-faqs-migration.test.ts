import { describe, expect, it, vi } from 'vitest';

import {
  productsProductFaqsLocalesSql,
  up,
} from '@/migrations/20260529_010000_products_product_faqs_locales';

describe('product direct FAQs locale migration', () => {
  it('creates the localized direct FAQ content tables used by Payload joins', () => {
    expect(productsProductFaqsLocalesSql).toContain(
      'CREATE TABLE IF NOT EXISTS "products_product_faqs_locales"',
    );
    expect(productsProductFaqsLocalesSql).toContain(
      'CREATE TABLE IF NOT EXISTS "_products_v_version_product_faqs_locales"',
    );
    expect(productsProductFaqsLocalesSql).toContain(
      '"products_product_faqs_locales_locale_parent_id_unique"',
    );
    expect(productsProductFaqsLocalesSql).toContain('"products_product_faqs_locales_parent_id_fk"');
    expect(productsProductFaqsLocalesSql).toContain(
      '"_products_v_version_product_faqs_locales_parent_id_fk"',
    );
    expect(productsProductFaqsLocalesSql).toContain('INSERT INTO "products_product_faqs_locales"');
  });

  it('runs the locale table migration SQL through the Payload Postgres pool', async () => {
    const query = vi.fn(() => Promise.resolve());

    await up({
      payload: {
        db: {
          pool: { query },
        },
      },
    } as never);

    expect(query).toHaveBeenCalledWith(productsProductFaqsLocalesSql);
  });
});
