import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import type { Locale } from '@/lib/i18n/locale';

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
  logoLight: CmsImageAsset;
  logoDark: CmsImageAsset;
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
  siteName?: string;
  tagline?: string;
  themeColor?: string;
};

const defaultSettingsByLocale: Record<Locale, CmsSiteSettings> = {
  zh: {
    siteName: '永霏防护',
    tagline: '特种防护装备制造商',
    themeColor: '#1e3a5f',
    logoLight: {
      alt: '永霏防护',
      height: 75,
      src: '/images/brand/yourfield-logo-official-a.png',
      width: 233,
    },
    logoDark: {
      alt: '永霏防护',
      height: 75,
      src: '/images/brand/yourfield-logo-official-b.png',
      width: 233,
    },
    contact: {
      address: '湖南省湘潭市高新区创业东路1号湖湘防护科创园',
      businessHours: '周一至周五 09:00-18:00',
      email: 'hnyf@yourfield.net',
      emailHref: 'mailto:hnyf@yourfield.net',
      phone: '400-6800181',
      phoneHref: 'tel:+864006800181',
    },
    coordinates: {
      lat: 27.816329,
      lng: 112.989066,
      zoom: 15,
    },
    icp: '湘ICP备18013725号-1',
    cookieConsent: {
      enabled: true,
    },
    analytics: {
      enabled: false,
    },
    mapService: 'amap',
  },
  en: {
    siteName: 'YourField Group',
    tagline: 'Protective equipment manufacturer',
    themeColor: '#1e3a5f',
    logoLight: {
      alt: 'YourField Group',
      height: 75,
      src: '/images/brand/yourfield-logo-official-a.png',
      width: 233,
    },
    logoDark: {
      alt: 'YourField Group',
      height: 75,
      src: '/images/brand/yourfield-logo-official-b.png',
      width: 233,
    },
    contact: {
      address: 'No. 1 Chuangye East Road, Xiangtan High-Tech Zone, Hunan, China',
      businessHours: 'Monday-Friday 09:00-18:00',
      email: 'hnyf@yourfield.net',
      emailHref: 'mailto:hnyf@yourfield.net',
      phone: '400-6800181',
      phoneHref: 'tel:+864006800181',
    },
    coordinates: {
      lat: 27.816329,
      lng: 112.989066,
      zoom: 15,
    },
    icp: '湘ICP备18013725号-1',
    cookieConsent: {
      enabled: true,
    },
    analytics: {
      enabled: false,
    },
    mapService: 'google',
  },
  ru: {
    siteName: 'YourField Group',
    tagline: 'Производитель защитного снаряжения',
    themeColor: '#1e3a5f',
    logoLight: {
      alt: 'YourField Group',
      height: 75,
      src: '/images/brand/yourfield-logo-official-a.png',
      width: 233,
    },
    logoDark: {
      alt: 'YourField Group',
      height: 75,
      src: '/images/brand/yourfield-logo-official-b.png',
      width: 233,
    },
    contact: {
      address: '№1, Chuangye East Road, Xiangtan High-Tech Zone, Hunan, China',
      businessHours: 'Понедельник-пятница 09:00-18:00',
      email: 'hnyf@yourfield.net',
      emailHref: 'mailto:hnyf@yourfield.net',
      phone: '400-6800181',
      phoneHref: 'tel:+864006800181',
    },
    coordinates: {
      lat: 27.816329,
      lng: 112.989066,
      zoom: 15,
    },
    icp: '湘ICP备18013725号-1',
    cookieConsent: {
      enabled: true,
    },
    analytics: {
      enabled: false,
    },
    mapService: 'google',
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

function phoneHref(phone: string, fallback: string) {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return fallback;
  }

  if (digits.startsWith('86')) {
    return `tel:+${digits}`;
  }

  if (digits.startsWith('400')) {
    return `tel:+86${digits}`;
  }

  return `tel:${digits}`;
}

function emailHref(email: string, fallback: string) {
  return email ? `mailto:${email}` : fallback;
}

function mapServiceForLocale(
  rows: CmsSiteSettingsDoc['mapServiceByLocale'],
  locale: Locale,
  fallback: CmsMapServiceName,
) {
  const service = rows?.find((row) => row.locale === locale)?.service;

  return service === 'amap' || service === 'google' ? service : fallback;
}

function mediaAsset(file: CmsUpload | number | string | undefined, fallback: CmsImageAsset) {
  if (!file || typeof file !== 'object') {
    return fallback;
  }

  const src = normalizeCmsMediaUrl(file.url ?? file.sizes?.thumbnail?.url, fallback.src);

  return {
    alt: asString(file.alt, fallback.alt),
    height: asNumber(file.height ?? file.sizes?.thumbnail?.height, fallback.height),
    src,
    width: asNumber(file.width ?? file.sizes?.thumbnail?.width, fallback.width),
  };
}

function mapSiteSettings(doc: CmsSiteSettingsDoc | undefined, locale: Locale): CmsSiteSettings {
  const fallback = defaultSettingsByLocale[locale];
  const contact = doc?.contact;
  const coordinates = doc?.coordinates;
  const phone = asString(contact?.phone, fallback.contact.phone);
  const email = asString(contact?.email, fallback.contact.email);
  const phoneSecondary = asString(contact?.phoneSecondary);
  const publicSecurityRecord = asString(doc?.publicSecurityRecord);
  const cookieTitle = asOptionalString(doc?.cookieConsent?.title, fallback.cookieConsent.title);
  const cookieDescription = asOptionalString(
    doc?.cookieConsent?.description,
    fallback.cookieConsent.description,
  );
  const cookieAcceptLabel = asOptionalString(
    doc?.cookieConsent?.acceptLabel,
    fallback.cookieConsent.acceptLabel,
  );
  const cookieRejectLabel = asOptionalString(
    doc?.cookieConsent?.rejectLabel,
    fallback.cookieConsent.rejectLabel,
  );
  const cookieEssentialOnlyLabel = asOptionalString(
    doc?.cookieConsent?.essentialOnlyLabel,
    fallback.cookieConsent.essentialOnlyLabel,
  );
  const umamiWebsiteId = asOptionalString(
    doc?.analytics?.umamiWebsiteId,
    fallback.analytics.umamiWebsiteId,
  );

  return {
    siteName: asString(doc?.siteName, fallback.siteName),
    tagline: asString(doc?.tagline, fallback.tagline),
    themeColor: asString(doc?.themeColor, fallback.themeColor),
    logoLight: mediaAsset(doc?.logo?.light, fallback.logoLight),
    logoDark: mediaAsset(doc?.logo?.dark, fallback.logoDark),
    contact: {
      address: asString(contact?.address, fallback.contact.address),
      businessHours: asString(contact?.businessHours, fallback.contact.businessHours),
      email,
      emailHref: emailHref(email, fallback.contact.emailHref),
      phone,
      phoneHref: phoneHref(phone, fallback.contact.phoneHref),
      ...(phoneSecondary ? { phoneSecondary } : {}),
    },
    coordinates: {
      lat: asNumber(coordinates?.lat, fallback.coordinates.lat),
      lng: asNumber(coordinates?.lng, fallback.coordinates.lng),
      zoom: asNumber(coordinates?.zoom, fallback.coordinates.zoom),
    },
    icp: asString(doc?.icp, fallback.icp),
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

const getCachedCmsSiteSettings = unstable_cache(getCmsSiteSettingsUncached, ['cms-site-settings'], {
  revalidate: CMS_CACHE_REVALIDATE_SECONDS,
  tags: [cmsGlobalCacheTag('site-settings')],
});

export const getCmsSiteSettings = cache(getCachedCmsSiteSettings);
