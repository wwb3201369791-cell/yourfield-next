import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const backfillProductI18nFeaturesAndGalleriesSql = `
WITH target_locales(locale) AS (
  VALUES ('en'), ('ru')
), translated_feature_copy AS (
  SELECT
    products.id AS product_db_id,
    target_locales.locale,
    CASE
      WHEN target_locales.locale = 'ru' THEN 'Защита и применение'
      ELSE 'Protection and application'
    END AS title,
    COALESCE(
      NULLIF(trim(products_locales.description #>> '{root,children,0,children,0,text}'), ''),
      NULLIF(trim(products_locales.name), ''),
      CASE
        WHEN target_locales.locale = 'ru' THEN 'Информация о защитном изделии поддерживается в CMS.'
        ELSE 'Protective product information is maintained in the CMS.'
      END
    ) AS description
  FROM products
  CROSS JOIN target_locales
  LEFT JOIN products_locales
    ON products_locales._parent_id = products.id
    AND products_locales._locale = target_locales.locale::_locales
  WHERE NOT EXISTS (
    SELECT 1
    FROM products_features existing_features
    WHERE existing_features._parent_id = products.id
      AND existing_features._locale = target_locales.locale::_locales
  )
), inserted_features AS (
  INSERT INTO products_features (_order, _parent_id, _locale, id, title, description)
  SELECT
    1,
    product_db_id,
    locale::_locales,
    substr(md5(product_db_id::text || ':' || locale || ':i18n-feature'), 1, 24),
    title,
    description
  FROM translated_feature_copy
  WHERE description <> ''
), zh_visual_groups AS (
  SELECT
    groups._parent_id AS product_db_id,
    groups.id AS source_group_id,
    groups._order,
    groups.variant,
    groups.title AS source_title,
    groups.description AS source_description,
    row_number() OVER (PARTITION BY groups._parent_id ORDER BY groups._order, groups.id) - 1 AS group_index
  FROM products_visual_groups groups
  WHERE groups._locale = 'zh'
), target_visual_groups AS (
  SELECT
    zh_visual_groups.*,
    target_locales.locale,
    substr(
      md5(zh_visual_groups.product_db_id::text || ':' || target_locales.locale || ':visual-group:' || zh_visual_groups.source_group_id::text),
      1,
      24
    ) AS target_group_id,
    CASE
      WHEN target_locales.locale = 'ru' AND zh_visual_groups.source_title LIKE '%建模%' THEN 'Детальные виды'
      WHEN target_locales.locale = 'ru' AND zh_visual_groups.source_title LIKE '%场景%' THEN 'Сцены применения'
      WHEN target_locales.locale = 'ru' AND zh_visual_groups.source_title LIKE '%模特%' THEN 'Вид на модели'
      WHEN target_locales.locale = 'ru' THEN 'Галерея продукта'
      WHEN zh_visual_groups.source_title LIKE '%建模%' THEN 'Detail views'
      WHEN zh_visual_groups.source_title LIKE '%场景%' THEN 'Application scenes'
      WHEN zh_visual_groups.source_title LIKE '%模特%' THEN 'Wearing views'
      ELSE 'Product gallery'
    END AS translated_title,
    CASE
      WHEN target_locales.locale = 'ru' THEN 'Показывает детали, конструкцию и посадку изделия.'
      ELSE 'Shows product details, structure, and wearing effect.'
    END AS translated_description
  FROM zh_visual_groups
  CROSS JOIN target_locales
  WHERE NOT EXISTS (
    SELECT 1
    FROM products_visual_groups existing_groups
    WHERE existing_groups._parent_id = zh_visual_groups.product_db_id
      AND existing_groups._locale = target_locales.locale::_locales
  )
), inserted_visual_groups AS (
  INSERT INTO products_visual_groups (_order, _parent_id, _locale, id, variant, title, description)
  SELECT
    _order,
    product_db_id,
    locale::_locales,
    target_group_id,
    COALESCE(NULLIF(variant::text, ''), 'gallery')::enum_products_visual_groups_variant,
    translated_title,
    translated_description
  FROM target_visual_groups
), zh_visual_images AS (
  SELECT
    target_visual_groups.product_db_id,
    target_visual_groups.locale,
    target_visual_groups.target_group_id,
    target_visual_groups.group_index,
    images._order,
    images.id AS source_image_row_id,
    row_number() OVER (
      PARTITION BY target_visual_groups.product_db_id, target_visual_groups.locale, target_visual_groups.target_group_id
      ORDER BY images._order, images.id
    ) - 1 AS image_index,
    rels.media_id
  FROM target_visual_groups
  JOIN products_visual_groups_images images
    ON images._parent_id = target_visual_groups.source_group_id
    AND images._locale = 'zh'
  JOIN products_rels rels
    ON rels.parent_id = target_visual_groups.product_db_id
    AND rels.locale = 'zh'
    AND rels.path = 'visualGroups.' || target_visual_groups.group_index::text || '.images.' || (images._order - 1)::text || '.file'
  WHERE rels.media_id IS NOT NULL
), inserted_visual_images AS (
  INSERT INTO products_visual_groups_images (_order, _parent_id, _locale, id, file_id)
  SELECT
    _order,
    target_group_id,
    locale::_locales,
    substr(
      md5(product_db_id::text || ':' || locale || ':visual-image:' || source_image_row_id::text),
      1,
      24
    ),
    media_id
  FROM zh_visual_images
), inserted_visual_rels AS (
  INSERT INTO products_rels ("order", parent_id, path, locale, media_id)
  SELECT
    NULL,
    product_db_id,
    'visualGroups.' || group_index::text || '.images.' || image_index::text || '.file',
    locale,
    media_id
  FROM zh_visual_images
)
UPDATE products
SET updated_at = now()
WHERE id IN (
  SELECT product_db_id FROM translated_feature_copy
  UNION
  SELECT product_db_id FROM target_visual_groups
);
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(backfillProductI18nFeaturesAndGalleriesSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally left blank: product translations/media relations are content backfill.
}
