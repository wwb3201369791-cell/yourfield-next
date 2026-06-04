import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock('@/lib/cms/payload', () => ({
  getPayloadClient: vi.fn(),
}));

import { getPayloadClient } from '@/lib/cms/payload';
import { getCmsSiteSettings } from '@/lib/cms/site-settings';

describe('CMS site settings mapper', () => {
  beforeEach(() => {
    vi.mocked(getPayloadClient).mockReset();
  });

  it('returns empty content fields instead of hardcoded brand/contact fallbacks', async () => {
    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal: vi.fn().mockResolvedValue({}),
    } as never);

    const settings = await getCmsSiteSettings('zh');

    expect(settings.siteName).toBe('');
    expect(settings.tagline).toBe('');
    expect(settings.logoLight).toBeNull();
    expect(settings.logoDark).toBeNull();
    expect(settings.contact).toMatchObject({
      address: '',
      businessHours: '',
      email: '',
      emailHref: '',
      phone: '',
      phoneHref: '',
    });
    expect(settings.icp).toBe('');
    expect(settings.publicSecurityRecord).toBeUndefined();
    expect(settings.seoVerification).toEqual({});
    expect(settings.themeColor).toBe('#1e3a5f');
    expect(settings.coordinates).toEqual({ lat: 0, lng: 0, zoom: 1 });
    expect(settings.cookieConsent.enabled).toBe(false);
    expect(settings.analytics.enabled).toBe(false);
  });

  it('maps Google and Baidu verification tokens from CMS site settings', async () => {
    vi.mocked(getPayloadClient).mockResolvedValue({
      findGlobal: vi.fn().mockResolvedValue({
        seoVerification: {
          baiduSiteVerification: 'baidu-token-from-cms',
          googleSiteVerification: 'google-token-from-cms',
        },
      }),
    } as never);

    const settings = await getCmsSiteSettings('zh');

    expect(settings.seoVerification).toEqual({
      baiduSiteVerification: 'baidu-token-from-cms',
      googleSiteVerification: 'google-token-from-cms',
    });
  });
});
