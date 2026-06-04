import { describe, expect, it } from 'vitest';

import { siteSettingsSeoVerificationSql } from '@/migrations/20260604_001500_site_settings_seo_verification';

describe('site settings SEO verification migration', () => {
  it('adds direct columns for Google and Baidu verification tokens', () => {
    expect(siteSettingsSeoVerificationSql).toContain(
      'ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "seo_verification_google_site_verification" varchar',
    );
    expect(siteSettingsSeoVerificationSql).toContain(
      'ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "seo_verification_baidu_site_verification" varchar',
    );
  });
});
