import { describe, expect, it } from 'vitest';

import { siteSettingsSolutionsUploadColumnsSql } from '@/migrations/20260530_070000_site_settings_solutions_upload_columns';

describe('site settings and solutions upload migration', () => {
  it('adds Payload 3 direct upload columns for global media and solution covers', () => {
    expect(siteSettingsSolutionsUploadColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "logo_light_id" integer',
    );
    expect(siteSettingsSolutionsUploadColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "site_settings_socials" ADD COLUMN IF NOT EXISTS "icon_id" integer',
    );
    expect(siteSettingsSolutionsUploadColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "solutions" ADD COLUMN IF NOT EXISTS "cover_id" integer',
    );
    expect(siteSettingsSolutionsUploadColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "_solutions_v" ADD COLUMN IF NOT EXISTS "version_cover_id" integer',
    );
  });

  it('backfills media assignments from existing relation paths', () => {
    expect(siteSettingsSolutionsUploadColumnsSql).toContain('settings_rel."path" = \'logo.light\'');
    expect(siteSettingsSolutionsUploadColumnsSql).toContain('settings_rel."path" = \'logo.dark\'');
    expect(siteSettingsSolutionsUploadColumnsSql).toContain('solution_rel."path" = \'cover\'');
    expect(siteSettingsSolutionsUploadColumnsSql).toContain(
      "('socials.' || (social.\"_order\" - 1)::text || '.icon')",
    );
  });
});
