import type { NewsItem } from '@/lib/cms/news';
import type { CmsSiteSettings } from '@/lib/cms/site-settings';
import type { Locale } from '@/lib/i18n/locale';
import { localizedPublicText, publicLocaleText } from '@/lib/product/publicText';
import { specValue, type Product, type ProductFaq } from '@/lib/product/types';
import { absoluteUrl, localizedPath, siteName } from '@/lib/seo/buildMetadata';

export type BreadcrumbItem = Readonly<{
  name: string;
  path: string;
}>;

function organizationName(locale: Locale, settings?: CmsSiteSettings) {
  return settings?.siteName || siteName(locale);
}

function organizationLogo(settings?: CmsSiteSettings) {
  return absoluteUrl(settings?.logoDark.src ?? '/images/brand/yourfield-logo-official-b.png');
}

function organizationTelephone(settings?: CmsSiteSettings) {
  return settings?.contact.phoneHref.replace(/^tel:/, '') || '+86-400-680-0181';
}

function organizationEmail(settings?: CmsSiteSettings) {
  return settings?.contact.email || 'hnyf@yourfield.net';
}

function organizationStreetAddress(locale: Locale, settings?: CmsSiteSettings) {
  if (settings?.contact.address) {
    return settings.contact.address;
  }

  return locale === 'zh'
    ? '湖南省湘潭市高新区创业东路1号湖湘防护科创园'
    : 'No. 1 Chuangye East Road, Xiangtan High-Tech Zone, Hunan, China';
}

export function organizationJsonLd(locale: Locale, settings?: CmsSiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizationName(locale, settings),
    url: absoluteUrl(localizedPath(locale, '/')),
    logo: organizationLogo(settings),
    foundingDate: '2002',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CN',
      addressRegion: 'Hunan',
      addressLocality: 'Xiangtan',
      streetAddress: organizationStreetAddress(locale, settings),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: organizationTelephone(settings),
      email: organizationEmail(settings),
      contactType: 'customer service',
      areaServed: ['CN', 'US', 'RU'],
    },
  };
}

export function websiteJsonLd(locale: Locale, settings?: CmsSiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: organizationName(locale, settings),
    url: absoluteUrl(localizedPath(locale, '/')),
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl(localizedPath(locale, '/search'))}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function collectionPageJsonLd(
  name: string,
  description: string,
  path: string,
  hasPart: readonly BreadcrumbItem[] = [],
) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
  };

  if (hasPart.length > 0) {
    data.hasPart = hasPart.map((item) => ({
      '@type': 'WebPage',
      name: item.name,
      url: absoluteUrl(item.path),
    }));
  }

  return data;
}

export function productJsonLd(product: Product, locale: Locale, settings?: CmsSiteSettings) {
  const path = localizedPath(locale, `/products/${product.id}`);
  const name = localizedPublicText(product.name, locale) || product.id;
  const category = localizedPublicText(product.categoryName, locale);
  const description = localizedPublicText(product.description, locale);
  const additionalProperty = product.specifications
    .map((item) => ({
      '@type': 'PropertyValue',
      name: localizedPublicText(item.label, locale),
      value: publicLocaleText(specValue(item.value, locale), locale),
    }))
    .filter((item) => item.name && item.value);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    sku: product.sku || product.model,
    model: product.model,
    brand: {
      '@type': 'Brand',
      name: organizationName(locale, settings),
    },
    image: product.images.filter(Boolean).map((image) => absoluteUrl(image)),
  };

  if (category) {
    data.category = category;
  }

  if (description) {
    data.description = description;
  }

  if (additionalProperty.length > 0) {
    data.additionalProperty = additionalProperty;
  }

  return data;
}

export function faqPageJsonLd(faqs: readonly ProductFaq[], locale: Locale, path: string) {
  const mainEntity = faqs
    .map((faq) => ({
      '@type': 'Question',
      name: localizedPublicText(faq.question, locale),
      acceptedAnswer: {
        '@type': 'Answer',
        text: localizedPublicText(faq.answer, locale),
      },
    }))
    .filter((faq) => faq.name && faq.acceptedAnswer.text);

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: absoluteUrl(path),
    inLanguage: locale,
    mainEntity,
  };
}

export function newsArticleJsonLd(
  item: NewsItem,
  locale: Locale,
  title: string,
  description: string,
  settings?: CmsSiteSettings,
) {
  const path = localizedPath(locale, `/news/${item.slug}`);
  const image = item.image ? [absoluteUrl(item.image)] : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: locale,
    datePublished: item.datePublished,
    dateModified: item.dateModified ?? item.datePublished,
    ...(image ? { image } : {}),
    author: {
      '@type': 'Organization',
      name: organizationName(locale, settings),
    },
    publisher: {
      '@type': 'Organization',
      name: organizationName(locale, settings),
      logo: {
        '@type': 'ImageObject',
        url: organizationLogo(settings),
      },
    },
  };
}

export function contactPageJsonLd(locale: Locale, settings?: CmsSiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: locale === 'zh' ? '联系我们' : locale === 'ru' ? 'Контакты' : 'Contact',
    url: absoluteUrl(localizedPath(locale, '/contact')),
    inLanguage: locale,
    mainEntity: organizationJsonLd(locale, settings),
  };
}
