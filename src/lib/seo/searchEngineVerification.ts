import type { Metadata } from 'next';

import type { CmsSiteSettings } from '@/lib/cms/site-settings';

type SearchEngineVerificationSettings = Pick<CmsSiteSettings, 'seoVerification'>;

function cleanVerificationToken(value: string | undefined) {
  const token = value?.trim();

  return token || undefined;
}

export function searchEngineVerificationMetadata(
  settings?: SearchEngineVerificationSettings,
): Pick<Metadata, 'verification'> {
  const google = cleanVerificationToken(settings?.seoVerification.googleSiteVerification);
  const baidu = cleanVerificationToken(settings?.seoVerification.baiduSiteVerification);

  if (!google && !baidu) {
    return {};
  }

  return {
    verification: {
      ...(google ? { google } : {}),
      ...(baidu
        ? {
            other: {
              'baidu-site-verification': baidu,
            },
          }
        : {}),
    },
  };
}
