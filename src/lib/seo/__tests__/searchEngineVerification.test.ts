import { describe, expect, it } from 'vitest';

import type { CmsSiteSettings } from '@/lib/cms/site-settings';
import { searchEngineVerificationMetadata } from '@/lib/seo/searchEngineVerification';

const settings = (seoVerification: CmsSiteSettings['seoVerification']): CmsSiteSettings => ({
  siteName: '',
  tagline: '',
  themeColor: '#1e3a5f',
  logoLight: null,
  logoDark: null,
  contact: {
    address: '',
    businessHours: '',
    email: '',
    emailHref: '',
    phone: '',
    phoneHref: '',
  },
  coordinates: { lat: 0, lng: 0, zoom: 1 },
  icp: '',
  cookieConsent: { enabled: false },
  analytics: { enabled: false },
  mapService: 'amap',
  seoVerification,
});

describe('search engine verification metadata', () => {
  it('omits Google/Baidu verification meta tags when CMS fields are empty', () => {
    expect(searchEngineVerificationMetadata(settings({}))).toEqual({});
    expect(
      searchEngineVerificationMetadata(
        settings({ baiduSiteVerification: '   ', googleSiteVerification: '' }),
      ),
    ).toEqual({});
  });

  it('maps CMS Google and Baidu verification tokens to Next metadata', () => {
    expect(
      searchEngineVerificationMetadata(
        settings({
          baiduSiteVerification: 'baidu-token-from-cms',
          googleSiteVerification: 'google-token-from-cms',
        }),
      ),
    ).toEqual({
      verification: {
        google: 'google-token-from-cms',
        other: {
          'baidu-site-verification': 'baidu-token-from-cms',
        },
      },
    });
  });
});
