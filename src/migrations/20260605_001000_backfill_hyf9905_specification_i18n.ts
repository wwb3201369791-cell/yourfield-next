import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (sql: string) => Promise<unknown>;
    };
  };
};

export const backfillHyf9905SpecificationI18nSql = `
DO $yf$
DECLARE
  hyf_product_db_id integer;
BEGIN
  SELECT id INTO hyf_product_db_id
  FROM products
  WHERE product_id = 'dry-water-rescue-suit-hyf-9905'
     OR slug = 'dry-water-rescue-suit-hyf-9905'
  ORDER BY id
  LIMIT 1;

  IF hyf_product_db_id IS NULL THEN
    RAISE NOTICE 'HYF-9905 product not found, skipping specification i18n backfill';
    RETURN;
  END IF;

  DELETE FROM products_specifications_locales
  WHERE _parent_id IN (
    SELECT id
    FROM products_specifications
    WHERE _parent_id = hyf_product_db_id
      AND id IN ('hyf9905-spec-01', 'hyf9905-spec-02', 'hyf9905-spec-03', 'hyf9905-spec-04')
  );

  INSERT INTO products_specifications_locales (_parent_id, _locale, label, value)
  SELECT spec.id, data.locale, data.label, data.value
  FROM (
    VALUES
      ('hyf9905-spec-01', 'zh'::_locales, '货号', 'HYF-9905'),
      ('hyf9905-spec-01', 'en'::_locales, 'Item No.', 'HYF-9905'),
      ('hyf9905-spec-01', 'ru'::_locales, 'Артикул', 'HYF-9905'),
      ('hyf9905-spec-02', 'zh'::_locales, '颜色', '红色'),
      ('hyf9905-spec-02', 'en'::_locales, 'Color', 'Red'),
      ('hyf9905-spec-02', 'ru'::_locales, 'Цвет', 'Красный'),
      ('hyf9905-spec-03', 'zh'::_locales, '尺码', 'S-XXL'),
      ('hyf9905-spec-03', 'en'::_locales, 'Size', 'S-XXL'),
      ('hyf9905-spec-03', 'ru'::_locales, 'Размер', 'S-XXL'),
      ('hyf9905-spec-04', 'zh'::_locales, '检测报告', '厂家有对应检测报告'),
      ('hyf9905-spec-04', 'en'::_locales, 'Test Report', 'Manufacturer test report available'),
      ('hyf9905-spec-04', 'ru'::_locales, 'Протокол испытаний', 'Есть соответствующий протокол испытаний производителя')
  ) AS data(spec_id, locale, label, value)
  INNER JOIN products_specifications spec
    ON spec.id = data.spec_id
   AND spec._parent_id = hyf_product_db_id;
END $yf$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(backfillHyf9905SpecificationI18nSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Content backfill only; intentionally no destructive rollback.
}
