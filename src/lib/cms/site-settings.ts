import type { Locale } from '@/lib/i18n/locale';
import { unstableCacheOrPassThrough } from '@/lib/next-cache';
import { reactCacheOrPassThrough } from '@/lib/react-cache';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsGlobalCacheTag } from './cache';
import { normalizeCmsMediaUrl } from './media';
import { getPayloadClient } from './payload';

export type CmsMapServiceName = 'amap' | 'google';

export type CmsImageAsset = Readonly<{
  alt: string;
  height: number;
  src: string;
  width: number;
}>;

export type CmsSiteSettings = Readonly<{
  siteName: string;
  tagline: string;
  themeColor: string;
  logoLight: CmsImageAsset | null;
  logoDark: CmsImageAsset | null;
  contact: Readonly<{
    address: string;
    businessHours: string;
    email: string;
    emailHref: string;
    phone: string;
    phoneHref: string;
    phoneSecondary?: string;
  }>;
  coordinates: Readonly<{
    lat: number;
    lng: number;
    zoom: number;
  }>;
  icp: string;
  cookieConsent: Readonly<{
    acceptLabel?: string;
    description?: string;
    enabled: boolean;
    essentialOnlyLabel?: string;
    rejectLabel?: string;
    title?: string;
  }>;
  analytics: Readonly<{
    enabled: boolean;
    umamiWebsiteId?: string;
  }>;
  mapService: CmsMapServiceName;
  publicSecurityRecord?: string;
  seoVerification: Readonly<{
    baiduSiteVerification?: string;
    googleSiteVerification?: string;
  }>;
}>;

type CmsUploadSize = {
  height?: number;
  url?: string;
  width?: number;
};

type CmsUpload = {
  alt?: string;
  height?: number;
  sizes?: Record<string, CmsUploadSize | undefined>;
  url?: string;
  width?: number;
};

type CmsSiteSettingsDoc = {
  contact?: {
    address?: string;
    businessHours?: string;
    email?: string;
    phone?: string;
    phoneSecondary?: string;
  };
  coordinates?: {
    lat?: number;
    lng?: number;
    zoom?: number;
  };
  icp?: string;
  cookieConsent?: {
    acceptLabel?: string;
    description?: string;
    enabled?: boolean;
    essentialOnlyLabel?: string;
    rejectLabel?: string;
    title?: string;
  };
  analytics?: {
    enabled?: boolean;
    umamiWebsiteId?: string;
  };
  logo?: {
    dark?: CmsUpload | number | string;
    light?: CmsUpload | number | string;
  };
  mapServiceByLocale?: Array<{
    locale?: string;
    service?: string;
  }>;
  publicSecurityRecord?: string;
  seoVerification?: {
    baiduSiteVerification?: string;
    googleSiteVerification?: string;
  };
  siteName?: string;
  tagline?: string;
  themeColor?: string;
};

const technicalDefaultsByLocale: Record<
  Locale,
  Readonly<{
    analytics: Readonly<{ enabled: boolean }>;
    cookieConsent: Readonly<{ enabled: boolean }>;
    coordinates: Readonly<{ lat: number; lng: number; zoom: number }>;
    logoDimensions: Readonly<{ height: number; width: number }>;
    mapService: CmsMapServiceName;
    themeColor: string;
  }>
> = {
  zh: {
    analytics: { enabled: false },
    cookieConsent: { enabled: false },
    coordinates: { lat: 0, lng: 0, zoom: 1 },
    logoDimensions: { height: 75, width: 233 },
    mapService: 'amap',
    themeColor: '#1e3a5f',
  },
  en: {
    analytics: { enabled: false },
    cookieConsent: { enabled: false },
    coordinates: { lat: 0, lng: 0, zoom: 1 },
    logoDimensions: { height: 75, width: 233 },
    mapService: 'google',
    themeColor: '#1e3a5f',
  },
  ru: {
    analytics: { enabled: false },
    cookieConsent: { enabled: false },
    coordinates: { lat: 0, lng: 0, zoom: 1 },
    logoDimensions: { height: 75, width: 233 },
    mapService: 'google',
    themeColor: '#1e3a5f',
  },
};

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asOptionalString(value: unknown, fallback?: string) {
  const normalized = asString(value, fallback ?? '');

  return normalized || undefined;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('86')) {
    return `tel:+${digits}`;
  }

  if (digits.startsWith('400')) {
    return `tel:+86${digits}`;
  }

  return `tel:${digits}`;
}

function emailHref(email: string) {
  return email ? `mailto:${email}` : '';
}

function mapServiceForLocale(
  rows: CmsSiteSettingsDoc['mapServiceByLocale'],
  locale: Locale,
  fallback: CmsMapServiceName,
) {
  const service = rows?.find((row) => row.locale === locale)?.service;

  return service === 'amap' || service === 'google' ? service : fallback;
}

function mediaAsset(
  file: CmsUpload | number | string | undefined,
  dimensions: Readonly<{ height: number; width: number }>,
): CmsImageAsset | null {
  if (!file || typeof file !== 'object') {
    return null;
  }

  const src = normalizeCmsMediaUrl(file.url ?? file.sizes?.thumbnail?.url, '');

  if (!src) {
    return null;
  }

  return {
    alt: asString(file.alt),
    height: asNumber(file.height ?? file.sizes?.thumbnail?.height, dimensions.height),
    src,
    width: asNumber(file.width ?? file.sizes?.thumbnail?.width, dimensions.width),
  };
}

function mapSiteSettings(doc: CmsSiteSettingsDoc | undefined, locale: Locale): CmsSiteSettings {
  const fallback = technicalDefaultsByLocale[locale];
  const contact = doc?.contact;
  const coordinates = doc?.coordinates;
  const phone = asString(contact?.phone);
  const email = asString(contact?.email);
  const phoneSecondary = asString(contact?.phoneSecondary);
  const publicSecurityRecord = asString(doc?.publicSecurityRecord);
  const cookieTitle = asOptionalString(doc?.cookieConsent?.title);
  const cookieDescription = asOptionalString(doc?.cookieConsent?.description);
  const cookieAcceptLabel = asOptionalString(doc?.cookieConsent?.acceptLabel);
  const cookieRejectLabel = asOptionalString(doc?.cookieConsent?.rejectLabel);
  const cookieEssentialOnlyLabel = asOptionalString(doc?.cookieConsent?.essentialOnlyLabel);
  const umamiWebsiteId = asOptionalString(doc?.analytics?.umamiWebsiteId);
  const baiduSiteVerification = asOptionalString(doc?.seoVerification?.baiduSiteVerification);
  const googleSiteVerification = asOptionalString(doc?.seoVerification?.googleSiteVerification);

  return {
    siteName: asString(doc?.siteName),
    tagline: asString(doc?.tagline),
    themeColor: asString(doc?.themeColor, fallback.themeColor),
    logoLight: mediaAsset(doc?.logo?.light, fallback.logoDimensions),
    logoDark: mediaAsset(doc?.logo?.dark, fallback.logoDimensions),
    contact: {
      address: asString(contact?.address),
      businessHours: asString(contact?.businessHours),
      email,
      emailHref: emailHref(email),
      phone,
      phoneHref: phoneHref(phone),
      ...(phoneSecondary ? { phoneSecondary } : {}),
    },
    coordinates: {
      lat: asNumber(coordinates?.lat, fallback.coordinates.lat),
      lng: asNumber(coordinates?.lng, fallback.coordinates.lng),
      zoom: asNumber(coordinates?.zoom, fallback.coordinates.zoom),
    },
    icp: asString(doc?.icp),
    cookieConsent: {
      enabled: asBoolean(doc?.cookieConsent?.enabled, fallback.cookieConsent.enabled),
      ...(cookieTitle ? { title: cookieTitle } : {}),
      ...(cookieDescription ? { description: cookieDescription } : {}),
      ...(cookieAcceptLabel ? { acceptLabel: cookieAcceptLabel } : {}),
      ...(cookieRejectLabel ? { rejectLabel: cookieRejectLabel } : {}),
      ...(cookieEssentialOnlyLabel ? { essentialOnlyLabel: cookieEssentialOnlyLabel } : {}),
    },
    analytics: {
      enabled: asBoolean(doc?.analytics?.enabled, fallback.analytics.enabled),
      ...(umamiWebsiteId ? { umamiWebsiteId } : {}),
    },
    mapService: mapServiceForLocale(doc?.mapServiceByLocale, locale, fallback.mapService),
    seoVerification: {
      ...(baiduSiteVerification ? { baiduSiteVerification } : {}),
      ...(googleSiteVerification ? { googleSiteVerification } : {}),
    },
    ...(publicSecurityRecord ? { publicSecurityRecord } : {}),
  };
}

async function getCmsSiteSettingsUncached(locale: Locale) {
  const payload = await getPayloadClient();
  const doc = (await payload.findGlobal({
    slug: 'site-settings',
    depth: 2,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
  })) as CmsSiteSettingsDoc | undefined;

  return mapSiteSettings(doc, locale);
}

const getCachedCmsSiteSettings = unstableCacheOrPassThrough(
  getCmsSiteSettingsUncached,
  ['cms-site-settings'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsGlobalCacheTag('site-settings')],
  },
);

export const getCmsSiteSettings = reactCacheOrPassThrough(getCachedCmsSiteSettings);
