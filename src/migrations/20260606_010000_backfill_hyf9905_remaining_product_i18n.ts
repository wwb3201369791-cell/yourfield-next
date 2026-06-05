import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (sql: string) => Promise<unknown>;
    };
  };
};

export const backfillHyf9905RemainingProductI18nSql = `
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
    RAISE NOTICE 'HYF-9905 product not found, skipping remaining product i18n backfill';
    RETURN;
  END IF;

  UPDATE products_locales
  SET
    size_guide_title = CASE _locale
      WHEN 'zh'::_locales THEN '尺码表'
      WHEN 'en'::_locales THEN 'Size Guide'
      WHEN 'ru'::_locales THEN 'Размерная таблица'
      ELSE size_guide_title
    END,
    size_guide_corner_label = CASE _locale
      WHEN 'zh'::_locales THEN '项目'
      WHEN 'en'::_locales THEN 'Item'
      WHEN 'ru'::_locales THEN 'Параметр'
      ELSE size_guide_corner_label
    END
  WHERE _parent_id = hyf_product_db_id
    AND _locale IN ('zh'::_locales, 'en'::_locales, 'ru'::_locales);

  UPDATE products_materials target
  SET value = data.value
  FROM (
    VALUES
      ('en'::_locales, 1, 'Dry water rescue protective material'),
      ('ru'::_locales, 1, 'Защитный материал сухого костюма для спасения на воде')
  ) AS data(locale, row_order, value)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  UPDATE products_applications target
  SET value = data.value
  FROM (
    VALUES
      ('en'::_locales, 1, 'Cold-season or low-temperature water rescue'),
      ('en'::_locales, 2, 'Flood control and flood disaster response'),
      ('en'::_locales, 3, 'Complex water rescue in rapids, tidal flats, marshes, and similar environments'),
      ('ru'::_locales, 1, 'Спасательные работы на воде в холодный сезон или при низкой температуре воды'),
      ('ru'::_locales, 2, 'Противопаводковые работы и ликвидация последствий наводнений'),
      ('ru'::_locales, 3, 'Сложные спасательные работы на быстринах, отмелях, болотах и других водных участках')
  ) AS data(locale, row_order, value)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  UPDATE products_care_instructions target
  SET value = data.value
  FROM (
    VALUES
      ('en'::_locales, 1, 'Maintain, inspect, and store according to the instructions supplied with the product and the company safety management requirements.'),
      ('ru'::_locales, 1, 'Обслуживайте, проверяйте и храните изделие согласно прилагаемой инструкции и требованиям безопасности предприятия.')
  ) AS data(locale, row_order, value)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  UPDATE products_features target
  SET title = data.title,
      description = data.description
  FROM (
    VALUES
      ('en'::_locales, 1, 'Low-temperature water protection', 'The dry water rescue suit is professional protective equipment for cold-season or low-temperature water rescue, flood control and flood disaster response, and complex water rescue in rapids, tidal flats, marshes, and similar environments. Its core function is to isolate cold and contaminated water, prevent hypothermia, and help rescuers maintain mobility during prolonged immersion.'),
      ('en'::_locales, 2, 'Complex rescue scenarios', 'Suitable for flood control, flood disaster response, and complex water rescue in rapids, tidal flats, marshes, and similar environments.'),
      ('ru'::_locales, 1, 'Защита в холодной воде', 'Сухой костюм для спасения на воде — профессиональное защитное снаряжение для спасательных работ в холодный сезон или в воде с низкой температурой, противопаводковых работ и ликвидации последствий наводнений, а также сложных работ на быстринах, отмелях, болотах и других водных участках. Основная функция — изолировать холодную и загрязненную воду, предотвращать переохлаждение и сохранять подвижность спасателя при длительном нахождении в воде.'),
      ('ru'::_locales, 2, 'Сложные спасательные сценарии', 'Подходит для противопаводковых работ, ликвидации последствий наводнений и сложных спасательных работ на воде в условиях быстрин, отмелей, болот и других участков.')
  ) AS data(locale, row_order, title, description)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  UPDATE products_selling_points target
  SET title = data.title,
      text = data.text
  FROM (
    VALUES
      ('en'::_locales, 1, 'Isolation from cold and contaminated water', 'Helps reduce the risk of hypothermia during prolonged immersion while maintaining rescuer mobility.'),
      ('ru'::_locales, 1, 'Изоляция от холодной и загрязненной воды', 'Помогает снизить риск переохлаждения при длительном нахождении в воде и сохранять подвижность спасателя.')
  ) AS data(locale, row_order, title, text)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  UPDATE products_scenarios target
  SET title = data.title,
      description = data.description
  FROM (
    VALUES
      ('en'::_locales, 1, 'Water rescue', 'The dry water rescue suit is designed for cold-season or low-temperature water rescue, flood control and flood disaster response, and complex water rescue in rapids, tidal flats, marshes, and similar environments. It isolates cold and contaminated water, helps prevent hypothermia, and supports mobility during long immersion.'),
      ('ru'::_locales, 1, 'Спасение на воде', 'Сухой костюм для спасения на воде предназначен для работ в холодный сезон или в воде с низкой температурой, противопаводковых работ и ликвидации последствий наводнений, а также сложных работ на быстринах, отмелях, болотах и других водных участках. Он изолирует холодную и загрязненную воду, помогает предотвратить переохлаждение и поддерживает подвижность при длительном нахождении в воде.')
  ) AS data(locale, row_order, title, description)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  UPDATE products_visual_groups target
  SET title = data.title,
      description = data.description
  FROM (
    VALUES
      ('en'::_locales, 1, 'Product Gallery', 'Shows the appearance, details, and wearing effect of the dry water rescue suit.'),
      ('ru'::_locales, 1, 'Галерея продукта', 'Показывает внешний вид, детали и посадку сухого костюма для спасения на воде.')
  ) AS data(locale, row_order, title, description)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  UPDATE products_quality_evidence target
  SET status = data.status,
      title = data.title,
      description = data.description
  FROM (
    VALUES
      ('en'::_locales, 1, 'Manufacturer test report available', 'Test report note', 'A corresponding manufacturer test report is available.'),
      ('ru'::_locales, 1, 'Имеется соответствующий протокол испытаний производителя', 'Сведения о протоколе испытаний', 'Имеется соответствующий протокол испытаний производителя.')
  ) AS data(locale, row_order, status, title, description)
  WHERE target._parent_id = hyf_product_db_id
    AND target._locale = data.locale
    AND target._order = data.row_order;

  DELETE FROM products_size_guide_columns_locales
  WHERE _parent_id IN (
    SELECT id
    FROM products_size_guide_columns
    WHERE _parent_id = hyf_product_db_id
  );

  INSERT INTO products_size_guide_columns_locales (_parent_id, _locale, label)
  SELECT column_row.id, data.locale, data.label
  FROM products_size_guide_columns column_row
  INNER JOIN (
    VALUES
      ('zh'::_locales, 1, '可选尺码'),
      ('en'::_locales, 1, 'Available Size'),
      ('ru'::_locales, 1, 'Доступный размер')
  ) AS data(locale, row_order, label)
    ON data.row_order = column_row._order
  WHERE column_row._parent_id = hyf_product_db_id;

  DELETE FROM products_size_guide_rows_locales
  WHERE _parent_id IN (
    SELECT id
    FROM products_size_guide_rows
    WHERE _parent_id = hyf_product_db_id
  );

  INSERT INTO products_size_guide_rows_locales (_parent_id, _locale, label)
  SELECT size_row.id, data.locale, data.label
  FROM products_size_guide_rows size_row
  INNER JOIN (
    VALUES
      ('zh'::_locales, 1, '尺码范围'),
      ('en'::_locales, 1, 'Size Range'),
      ('ru'::_locales, 1, 'Диапазон размеров')
  ) AS data(locale, row_order, label)
    ON data.row_order = size_row._order
  WHERE size_row._parent_id = hyf_product_db_id;

  UPDATE products
  SET updated_at = now()
  WHERE id = hyf_product_db_id;
END $yf$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(backfillHyf9905RemainingProductI18nSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Content backfill only; intentionally no destructive rollback.
}
