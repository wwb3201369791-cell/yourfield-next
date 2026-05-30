import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const seedHyf9905WaterRescueProductSql = `
DO $yf$
DECLARE
  hyf_product_id constant text := 'dry-water-rescue-suit-hyf-9905';
  hyf_model constant text := 'HYF-9905';
  hyf_name constant text := '干式水域救援服';
  hyf_description constant text := '干式水域救援服适用于寒冷季节或低温水域救援，抗洪抢险与洪涝灾害处置，激流、滩涂、沼泽等复杂水域救援的专业防护装备，核心功能是隔绝冷水、污水，防止失温，并保障救援人员在长时间浸泡中保持行动能力。';
  hyf_group_id integer;
  hyf_product_db_id integer;
  hyf_now timestamptz := now();
  hyf_media_ids integer[] := '{}';
  hyf_media_id integer;
  hyf_gallery_group_id text;
  hyf_locale text;
  hyf_index integer;
  hyf_filename text;
  hyf_mime text;
  hyf_filesize integer;
  hyf_width integer;
  hyf_height integer;
  hyf_ext text;
  hyf_caption text;
  hyf_description_json jsonb := jsonb_build_object(
    'root', jsonb_build_object(
      'children', jsonb_build_array(
        jsonb_build_object(
          'children', jsonb_build_array(
            jsonb_build_object(
              'detail', 0,
              'format', 0,
              'mode', 'normal',
              'style', '',
              'text', hyf_description,
              'type', 'text',
              'version', 1
            )
          ),
          'direction', null,
          'format', '',
          'indent', 0,
          'type', 'paragraph',
          'version', 1
        )
      ),
      'direction', null,
      'format', '',
      'indent', 0,
      'type', 'root',
      'version', 1
    )
  );
  hyf_media_rows text[][] := ARRAY[
    ARRAY['039_image39-1.png', 'image/png', '416864', '664', '1190'],
    ARRAY['040_image40-1.png', 'image/png', '372022', '620', '1111'],
    ARRAY['041_image41-1.png', 'image/png', '474104', '800', '800'],
    ARRAY['042_image42-1.png', 'image/png', '179949', '429', '419'],
    ARRAY['043_image43-1.png', 'image/png', '130721', '423', '481'],
    ARRAY['044_image44-1.jpeg', 'image/jpeg', '273706', '1200', '1200'],
    ARRAY['045_image45-1.png', 'image/png', '113050', '154', '732'],
    ARRAY['046_image46-1.png', 'image/png', '59556', '174', '392'],
    ARRAY['047_image47-1.png', 'image/png', '113700', '578', '578'],
    ARRAY['048_image48-1.png', 'image/png', '375951', '637', '1141'],
    ARRAY['049_image49-1.png', 'image/png', '315223', '594', '1065']
  ];
BEGIN
  SELECT id INTO hyf_group_id
  FROM product_groups
  WHERE group_id = 'water-rescue'
  ORDER BY id
  LIMIT 1;

  IF hyf_group_id IS NULL THEN
    RAISE EXCEPTION 'Missing product group water-rescue for HYF-9905 migration';
  END IF;

  FOR hyf_index IN 1..array_length(hyf_media_rows, 1) LOOP
    hyf_filename := hyf_media_rows[hyf_index][1];
    hyf_mime := hyf_media_rows[hyf_index][2];
    hyf_filesize := hyf_media_rows[hyf_index][3]::integer;
    hyf_width := hyf_media_rows[hyf_index][4]::integer;
    hyf_height := hyf_media_rows[hyf_index][5]::integer;
    hyf_caption := hyf_name || ' ' || hyf_model || ' 产品图 ' || hyf_index::text;
    hyf_ext := CASE WHEN hyf_filename LIKE '%.jpeg' THEN 'jpg' ELSE 'png' END;

    SELECT media.id INTO hyf_media_id
    FROM media
    WHERE media.id IN (
      SELECT media_tags._parent_id
      FROM media_tags
      WHERE media_tags.value = '指定资料/干式水域救援服_HYF-9905/' || replace(hyf_filename, '-1.', '.')
         OR media_tags.value = hyf_product_id
    )
      AND media.filename = hyf_filename
    ORDER BY media.id
    LIMIT 1;

    IF hyf_media_id IS NULL THEN
      SELECT id INTO hyf_media_id
      FROM media
      WHERE filename = hyf_filename
      ORDER BY id
      LIMIT 1;
    END IF;

    IF hyf_media_id IS NULL THEN
      INSERT INTO media (
        credit,
        folder,
        usage_count,
        updated_at,
        created_at,
        url,
        filename,
        mime_type,
        filesize,
        width,
        height,
        focal_x,
        focal_y,
        sizes_thumbnail_url,
        sizes_thumbnail_filename,
        sizes_card_url,
        sizes_card_filename,
        sizes_feature_url,
        sizes_feature_filename,
        sizes_hero_url,
        sizes_hero_filename,
        sizes_mobile_url,
        sizes_mobile_filename,
        sizes_og_url,
        sizes_og_filename
      ) VALUES (
        '资料文件/拆分结果',
        'products',
        0,
        hyf_now,
        hyf_now,
        '/payload-api/media/file/' || hyf_filename,
        hyf_filename,
        hyf_mime,
        hyf_filesize,
        hyf_width,
        hyf_height,
        50,
        50,
        '/payload-api/media/file/' || regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-200x200.' || hyf_ext),
        regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-200x200.' || hyf_ext),
        '/payload-api/media/file/' || regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-600x400.' || hyf_ext),
        regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-600x400.' || hyf_ext),
        '/payload-api/media/file/' || regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-1024x768.' || hyf_ext),
        regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-1024x768.' || hyf_ext),
        '/payload-api/media/file/' || regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-1920x1080.' || hyf_ext),
        regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-1920x1080.' || hyf_ext),
        '/payload-api/media/file/' || regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-480x640.' || hyf_ext),
        regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-480x640.' || hyf_ext),
        '/payload-api/media/file/' || regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-1200x630.' || hyf_ext),
        regexp_replace(hyf_filename, '\\.(png|jpeg)$', '-1200x630.' || hyf_ext)
      )
      RETURNING id INTO hyf_media_id;
    ELSE
      UPDATE media
      SET credit = '资料文件/拆分结果',
        folder = 'products',
        usage_count = COALESCE(usage_count, 0),
        updated_at = hyf_now,
        url = '/payload-api/media/file/' || hyf_filename,
        filename = hyf_filename,
        mime_type = hyf_mime,
        filesize = hyf_filesize,
        width = hyf_width,
        height = hyf_height,
        focal_x = COALESCE(focal_x, 50),
        focal_y = COALESCE(focal_y, 50)
      WHERE id = hyf_media_id;
    END IF;

    DELETE FROM media_locales WHERE _parent_id = hyf_media_id;
    DELETE FROM media_tags WHERE _parent_id = hyf_media_id;

    FOREACH hyf_locale IN ARRAY ARRAY['zh', 'en', 'ru'] LOOP
      INSERT INTO media_locales (_parent_id, _locale, alt, caption)
      VALUES (hyf_media_id, hyf_locale::_locales, hyf_caption, hyf_caption);
    END LOOP;

    INSERT INTO media_tags (_order, _parent_id, id, value) VALUES
      (1, hyf_media_id, 'hyf9905-media-source-' || hyf_index::text, '指定资料/干式水域救援服_HYF-9905/' || replace(hyf_filename, '-1.', '.')),
      (2, hyf_media_id, 'hyf9905-media-product-' || hyf_index::text, hyf_product_id),
      (3, hyf_media_id, 'hyf9905-media-model-' || hyf_index::text, hyf_model),
      (4, hyf_media_id, 'hyf9905-media-group-' || hyf_index::text, 'water-rescue');

    hyf_media_ids := array_append(hyf_media_ids, hyf_media_id);
  END LOOP;

  SELECT id INTO hyf_product_db_id
  FROM products
  WHERE product_id = hyf_product_id OR model = hyf_model OR slug = hyf_product_id
  ORDER BY id
  LIMIT 1;

  IF hyf_product_db_id IS NULL THEN
    INSERT INTO products (
      product_id,
      sku,
      model,
      slug,
      display_order,
      published_at,
      updated_at,
      created_at,
      _status,
      product_group_id
    ) VALUES (
      hyf_product_id,
      hyf_model,
      hyf_model,
      hyf_product_id,
      1,
      hyf_now,
      hyf_now,
      hyf_now,
      'published',
      hyf_group_id
    ) RETURNING id INTO hyf_product_db_id;
  ELSE
    UPDATE products
    SET product_id = hyf_product_id,
      sku = hyf_model,
      model = hyf_model,
      slug = hyf_product_id,
      display_order = 1,
      published_at = COALESCE(published_at, hyf_now),
      updated_at = hyf_now,
      _status = 'published',
      product_group_id = hyf_group_id
    WHERE id = hyf_product_db_id;
  END IF;

  DELETE FROM products_size_guide_rows_values
  WHERE _parent_id IN (SELECT id FROM products_size_guide_rows WHERE _parent_id = hyf_product_db_id);
  DELETE FROM products_size_guide_rows_locales
  WHERE _parent_id IN (SELECT id FROM products_size_guide_rows WHERE _parent_id = hyf_product_db_id);
  DELETE FROM products_size_guide_rows WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_size_guide_columns_locales
  WHERE _parent_id IN (SELECT id FROM products_size_guide_columns WHERE _parent_id = hyf_product_db_id);
  DELETE FROM products_size_guide_columns WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_specifications_locales
  WHERE _parent_id IN (SELECT id FROM products_specifications WHERE _parent_id = hyf_product_db_id);
  DELETE FROM products_visual_groups_images
  WHERE _parent_id IN (SELECT id FROM products_visual_groups WHERE _parent_id = hyf_product_db_id);

  DELETE FROM products_locales WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_images WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_standards WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_size_range WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_materials WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_features WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_selling_points WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_specifications WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_applications WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_scenarios WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_visual_groups WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_quality_evidence WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_care_instructions WHERE _parent_id = hyf_product_db_id;
  DELETE FROM products_rels WHERE parent_id = hyf_product_db_id;

  FOREACH hyf_locale IN ARRAY ARRAY['zh', 'en', 'ru'] LOOP
    INSERT INTO products_locales (_parent_id, _locale, name, description)
    VALUES (hyf_product_db_id, hyf_locale::_locales, hyf_name, hyf_description_json);
  END LOOP;

  INSERT INTO products_rels ("order", parent_id, path, locale, product_groups_id)
  VALUES (NULL, hyf_product_db_id, 'productGroup', NULL, hyf_group_id);

  INSERT INTO products_images (_order, _parent_id, id, file_id)
  VALUES (1, hyf_product_db_id, 'hyf9905-main-01', hyf_media_ids[1]);
  INSERT INTO products_rels ("order", parent_id, path, locale, media_id)
  VALUES (NULL, hyf_product_db_id, 'images.0.file', NULL, hyf_media_ids[1]);

  INSERT INTO products_standards (_order, _parent_id, id, value)
  VALUES (1, hyf_product_db_id, 'hyf9905-standard-01', '暂无标准');
  INSERT INTO products_size_range (_order, _parent_id, id, value)
  VALUES (1, hyf_product_db_id, 'hyf9905-size-01', 'S-XXL');

  FOREACH hyf_locale IN ARRAY ARRAY['zh', 'en', 'ru'] LOOP
    INSERT INTO products_materials (_order, _parent_id, _locale, id, value)
    VALUES (1, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-material-' || hyf_locale || '-01', '干式水域救援防护材料');

    INSERT INTO products_features (_order, _parent_id, _locale, id, title, description) VALUES
      (1, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-feature-' || hyf_locale || '-01', '低温水域防护', hyf_description),
      (2, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-feature-' || hyf_locale || '-02', '复杂救援场景', '适用于抗洪抢险、洪涝灾害处置、激流、滩涂、沼泽等复杂水域救援。');

    INSERT INTO products_selling_points (_order, _parent_id, _locale, id, title, text)
    VALUES (1, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-selling-' || hyf_locale || '-01', '隔绝冷水与污水', '帮助降低长时间浸泡导致的失温风险，并保障救援人员行动能力。');

    INSERT INTO products_applications (_order, _parent_id, _locale, id, value) VALUES
      (1, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-app-' || hyf_locale || '-01', '寒冷季节或低温水域救援'),
      (2, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-app-' || hyf_locale || '-02', '抗洪抢险与洪涝灾害处置'),
      (3, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-app-' || hyf_locale || '-03', '激流、滩涂、沼泽等复杂水域救援');

    INSERT INTO products_scenarios (_order, _parent_id, _locale, id, title, description)
    VALUES (1, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-scenario-' || hyf_locale || '-01', '水域救援', hyf_description);

    INSERT INTO products_quality_evidence (_order, _parent_id, _locale, id, type, status, title, description)
    VALUES (1, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-quality-' || hyf_locale || '-01', 'other', '厂家有对应检测报告', '检测报告说明', '厂家有对应检测报告。');

    INSERT INTO products_care_instructions (_order, _parent_id, _locale, id, value)
    VALUES (1, hyf_product_db_id, hyf_locale::_locales, 'hyf9905-care-' || hyf_locale || '-01', '请按产品随附说明和企业安全管理要求维护、检查与存放。');
  END LOOP;

  INSERT INTO products_specifications (_order, _parent_id, id, "group", "order") VALUES
    (1, hyf_product_db_id, 'hyf9905-spec-01', '产品资料', 1),
    (2, hyf_product_db_id, 'hyf9905-spec-02', '产品资料', 2),
    (3, hyf_product_db_id, 'hyf9905-spec-03', '产品资料', 3),
    (4, hyf_product_db_id, 'hyf9905-spec-04', '产品资料', 4);

  FOREACH hyf_locale IN ARRAY ARRAY['zh', 'en', 'ru'] LOOP
    INSERT INTO products_specifications_locales (_parent_id, _locale, label, value) VALUES
      ('hyf9905-spec-01', hyf_locale::_locales, '货号', hyf_model),
      ('hyf9905-spec-02', hyf_locale::_locales, '颜色', '红色'),
      ('hyf9905-spec-03', hyf_locale::_locales, '尺码', 'S-XXL'),
      ('hyf9905-spec-04', hyf_locale::_locales, '检测报告', '厂家有对应检测报告');
  END LOOP;

  FOREACH hyf_locale IN ARRAY ARRAY['zh', 'en', 'ru'] LOOP
    hyf_gallery_group_id := 'hyf9905-gallery-' || hyf_locale || '-01';
    INSERT INTO products_visual_groups (_order, _parent_id, _locale, id, variant, title, description)
    VALUES (1, hyf_product_db_id, hyf_locale::_locales, hyf_gallery_group_id, 'gallery', '产品图册', '展示干式水域救援服产品外观、细节与穿着效果。');

    FOR hyf_index IN 2..array_length(hyf_media_ids, 1) LOOP
      INSERT INTO products_visual_groups_images (_order, _parent_id, _locale, id, file_id)
      VALUES (
        hyf_index - 1,
        hyf_gallery_group_id,
        hyf_locale::_locales,
        'hyf9905-gallery-image-' || hyf_locale || '-' || lpad((hyf_index - 1)::text, 2, '0'),
        hyf_media_ids[hyf_index]
      );
      INSERT INTO products_rels ("order", parent_id, path, locale, media_id)
      VALUES (
        NULL,
        hyf_product_db_id,
        'visualGroups.0.images.' || (hyf_index - 2)::text || '.file',
        hyf_locale::_locales,
        hyf_media_ids[hyf_index]
      );
    END LOOP;
  END LOOP;
END $yf$;
`;

export const removeHyf9905WaterRescueProductSql = `
DO $yf$
DECLARE
  hyf_product_id constant text := 'dry-water-rescue-suit-hyf-9905';
  hyf_product_db_id integer;
BEGIN
  SELECT id INTO hyf_product_db_id
  FROM products
  WHERE product_id = hyf_product_id OR slug = hyf_product_id
  ORDER BY id
  LIMIT 1;

  IF hyf_product_db_id IS NOT NULL THEN
    DELETE FROM products WHERE id = hyf_product_db_id;
  END IF;

  DELETE FROM media
  WHERE id IN (
    SELECT _parent_id
    FROM media_tags
    WHERE value = hyf_product_id
  );
END $yf$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(seedHyf9905WaterRescueProductSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(removeHyf9905WaterRescueProductSql);
}
