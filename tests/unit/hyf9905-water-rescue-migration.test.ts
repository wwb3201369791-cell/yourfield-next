import { describe, expect, it } from 'vitest';

import {
  removeHyf9905WaterRescueProductSql,
  seedHyf9905WaterRescueProductSql,
} from '@/migrations/20260531_020000_seed_hyf9905_water_rescue_product';

const expectedProductImages = [
  '039_image39-1.png',
  '040_image40-1.png',
  '041_image41-1.png',
  '042_image42-1.png',
  '043_image43-1.png',
  '044_image44-1.jpeg',
  '045_image45-1.png',
  '046_image46-1.png',
  '047_image47-1.png',
  '048_image48-1.png',
  '049_image49-1.png',
];

describe('HYF-9905 water rescue product migration', () => {
  it('seeds the requested product into the water-rescue group with original uploaded media', () => {
    expect(seedHyf9905WaterRescueProductSql).toContain('dry-water-rescue-suit-hyf-9905');
    expect(seedHyf9905WaterRescueProductSql).toContain('HYF-9905');
    expect(seedHyf9905WaterRescueProductSql).toContain('干式水域救援服');
    expect(seedHyf9905WaterRescueProductSql).toContain("group_id = 'water-rescue'");
    expect(seedHyf9905WaterRescueProductSql).toContain('products_images');
    expect(seedHyf9905WaterRescueProductSql).toContain('products_visual_groups_images');

    expect(seedHyf9905WaterRescueProductSql).toContain('hyf_locale::_locales');
    expect(seedHyf9905WaterRescueProductSql).not.toContain('hyf_locale::locale');

    for (const filename of expectedProductImages) {
      expect(seedHyf9905WaterRescueProductSql).toContain(filename);
    }
  });

  it('is idempotent and replaces only the HYF-9905 nested rows before re-inserting them', () => {
    expect(seedHyf9905WaterRescueProductSql).toContain(
      'WHERE product_id = hyf_product_id OR model = hyf_model OR slug = hyf_product_id',
    );
    expect(seedHyf9905WaterRescueProductSql).toContain('DELETE FROM products_visual_groups_images');
    expect(seedHyf9905WaterRescueProductSql).toContain('DELETE FROM products_rels');
    expect(seedHyf9905WaterRescueProductSql).not.toContain('TRUNCATE');
  });

  it('removes only the seeded product and media on rollback', () => {
    expect(removeHyf9905WaterRescueProductSql).toContain('dry-water-rescue-suit-hyf-9905');
    expect(removeHyf9905WaterRescueProductSql).toContain(
      'DELETE FROM products WHERE id = hyf_product_db_id',
    );
    expect(removeHyf9905WaterRescueProductSql).toContain('DELETE FROM media');
    expect(removeHyf9905WaterRescueProductSql).not.toContain('DELETE FROM product_groups');
  });
});
